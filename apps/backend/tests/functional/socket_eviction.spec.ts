import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { HttpContext } from '@adonisjs/core/http'
import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import socket from '@rlanz/socket/services/main'
import { Socket } from '@rlanz/socket/client'
import Channel from '#models/channel'
import User from '#models/user'
import UserChannel from '#models/user_channel'
import ChannelService from '#services/channel_service'

test.group('Socket eviction', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('leaving evicts every tab, preserves presence, and rechecks membership on resubscribe', async ({
    assert,
  }) => {
    async function createUser() {
      const id = randomUUID()
      return User.create({
        id,
        name: 'Eviction',
        lastName: 'Test',
        nick: `evict_${id.slice(0, 8)}`,
        email: `${id}@example.com`,
        password: 'password123',
        state: 'Online',
        mentionOnlyNotif: false,
      })
    }

    const owner = await createUser()
    const member = await createUser()
    const room = await Channel.createWithOwner(owner.id, `evict-${randomUUID()}`, 'public')
    const other = await Channel.createWithOwner(owner.id, `other-${randomUUID()}`, 'public')
    await UserChannel.addMember(room.id, member.id)
    await UserChannel.addMember(other.id, member.id)
    const name = `channels/${room.id}`
    const otherName = `channels/${other.id}`
    const presence = await app.container.make('socket.presence')
    const server = createServer()
    const clients: Socket[] = []
    let authenticatedUser = member

    try {
      // Real WebSockets and channel middleware; only HTTP login is bypassed.
      socket.setPresenceManager(presence)
      await socket.boot(
        server,
        { websocket: { authenticate: async () => authenticatedUser } },
        await app.container.make('socket.router'),
        await app.container.make('logger'),
        async (_request, handler) => handler({} as HttpContext)
      )
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

      for (let tab = 0; tab < 3; tab++) {
        authenticatedUser = tab === 2 ? owner : member
        const client = new Socket({ url, autoReconnect: false })
        clients.push(client)
        await client.connect()
        await client.channel('users/online').subscribe()
        await client.channel(name).subscribe()
        await client.channel(otherName).subscribe()
      }
      const tabs = clients.slice(0, 2)
      const observer = clients[2]!
      const oldChannels = tabs.map((client) => client.channel(name))
      let disconnects = 0
      let receivedAfterEviction = 0
      let presenceUpdates = 0
      for (const client of clients) client.on('disconnect', () => disconnects++)
      observer.channel('users/online').listen('presence:updated', () => presenceUpdates++)
      const evictions = tabs.map(
        (client) =>
          new Promise<void>((resolve) => {
            client.on<{ channel: string }>('channel:evicted', (event) => {
              if (event.channel === name) resolve()
            })
          })
      )

      await new ChannelService().leaveChannel(member.id, room.id)
      await Promise.all(evictions)
      assert.equal(presence.getLocalSockets(name).length, 1)
      assert.equal(presence.getLocalSockets('users/online').length, 3)
      assert.equal(presence.getLocalSockets(otherName).length, 3)

      for (const [index, client] of tabs.entries()) {
        assert.isTrue(client.connected)
        assert.isFalse(oldChannels[index]!.active)
        assert.isFalse(oldChannels[index]!.subscribed)
        const fresh = client.channel(name)
        assert.notStrictEqual(fresh, oldChannels[index])
        await assert.rejects(() => fresh.subscribe(), 'Not a member of this channel')
        // Bypass client state: the server must reject these frames itself.
        for (const type of ['message', 'whisper']) {
          const reply = await client.sendRequest<{ ok: boolean; error: string }>({
            type,
            channel: name,
            event: 'members:sync',
          })
          assert.isFalse(reply.ok)
          assert.equal(reply.error, 'Not subscribed')
        }
        client.on(`channel:${name}:event`, () => receivedAfterEviction++)
      }
      socket.to(name).emit('eviction:test', {})
      // An ack on the same connection acts as a barrier after the broadcast.
      for (const client of clients) {
        await client.channel(otherName).sendWithAck('members:sync')
      }
      assert.equal(receivedAfterEviction, 0)
      assert.equal(disconnects, 0)
      assert.equal(presenceUpdates, 0)

      await UserChannel.addMember(room.id, member.id)
      for (const client of tabs) await client.channel(name).subscribe()
      assert.equal(presence.getLocalSockets(name).length, 3)
      assert.equal(disconnects, 0)
    } finally {
      for (const client of clients) client.disconnect()
      await socket.close()
      if (server.listening) {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve()))
        )
      }
    }
  }).timeout(15_000)
})
