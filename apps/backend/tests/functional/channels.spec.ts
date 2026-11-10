import { randomUUID } from 'node:crypto'
import { mock } from 'node:test'
import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import app from '@adonisjs/core/services/app'
import socket from '@rlanz/socket/services/main'
import Channel from '#models/channel'
import User from '#models/user'
import UserChannel from '#models/user_channel'
import Msg from '#models/msg'

async function createTestUser(prefix: string): Promise<User> {
  const unique = `${prefix}_${randomUUID().slice(0, 8)}`
  return User.create({
    id: randomUUID(),
    name: prefix,
    lastName: 'Test',
    nick: unique,
    email: `${unique}@example.com`,
    password: 'password123',
    state: 'Online',
    mentionOnlyNotif: false,
  })
}

test.group('Channels endpoints (/channels)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('POST /channels/create creates a channel and GET /channels lists it', async ({
    client,
    assert,
  }) => {
    const owner = await createTestUser('owner')

    const createRes = await client
      .post('/channels/create')
      .withGuard('web')
      .loginAs(owner)
      .json({ name: 'test-room', type: 'public' })

    createRes.assertStatus(201)
    const createdChannel = createRes.body()
    assert.equal(createdChannel.name, 'test-room')
    assert.equal(createdChannel.type, 'public')
    assert.equal(createdChannel.owner, owner.id)

    const listRes = await client.get('/channels').withGuard('web').loginAs(owner)
    listRes.assertStatus(200)
    assert.lengthOf(listRes.body(), 1)
    assert.equal(listRes.body()[0].id, createdChannel.id)
  })

  test('POST /channels/join returns 404 when channel does not exist, and joins when public', async ({
    client,
    assert,
  }) => {
    const owner = await createTestUser('owner')
    const joiner = await createTestUser('joiner')

    const missingRes = await client
      .post('/channels/join')
      .withGuard('web')
      .loginAs(joiner)
      .json({ name: 'non-existent-channel' })
    missingRes.assertStatus(404)
    assert.isNull(await Channel.findByName('non-existent-channel'))

    await client
      .post('/channels/create')
      .withGuard('web')
      .loginAs(owner)
      .json({ name: 'public-lobby', type: 'public' })

    const joinRes = await client
      .post('/channels/join')
      .withGuard('web')
      .loginAs(joiner)
      .json({ name: 'public-lobby' })

    joinRes.assertStatus(200)
    assert.equal(joinRes.body().name, 'public-lobby')

    const membersRes = await client
      .get(`/channels/${joinRes.body().id}/members`)
      .withGuard('web')
      .loginAs(joiner)

    membersRes.assertStatus(200)
    assert.lengthOf(membersRes.body(), 2)
  })

  test('POST /channels/join rejects private channels with 403', async ({ client }) => {
    const owner = await createTestUser('owner')
    const outsider = await createTestUser('outsider')

    await client
      .post('/channels/create')
      .withGuard('web')
      .loginAs(owner)
      .json({ name: 'secret-room', type: 'private' })

    const joinRes = await client
      .post('/channels/join')
      .withGuard('web')
      .loginAs(outsider)
      .json({ name: 'secret-room' })

    joinRes.assertStatus(403)
  })

  test('GET /channels/:channelId/msgs paginates messages using beforeId and limit', async ({
    client,
    assert,
  }) => {
    const owner = await createTestUser('owner')

    const createRes = await client
      .post('/channels/create')
      .withGuard('web')
      .loginAs(owner)
      .json({ name: 'chat-history', type: 'public' })
    const channelId = createRes.body().id

    const msg1 = await Msg.create({
      channelId,
      senderId: owner.id,
      contentType: 'text',
      textContent: 'First message',
      createdAt: DateTime.now().minus({ minutes: 3 }),
    })
    const msg2 = await Msg.create({
      channelId,
      senderId: owner.id,
      contentType: 'text',
      textContent: 'Second message',
      createdAt: DateTime.now().minus({ minutes: 2 }),
    })
    const msg3 = await Msg.create({
      channelId,
      senderId: owner.id,
      contentType: 'text',
      textContent: 'Third message',
      createdAt: DateTime.now().minus({ minutes: 1 }),
    })

    const latestRes = await client
      .get(`/channels/${channelId}/msgs`)
      .qs({ limit: 2 })
      .withGuard('web')
      .loginAs(owner)

    latestRes.assertStatus(200)
    assert.deepEqual(
      latestRes.body().map((m: { id: number }) => m.id),
      [msg2.id, msg3.id]
    )

    const olderRes = await client
      .get(`/channels/${channelId}/msgs`)
      .qs({ beforeId: msg2.id, limit: 2 })
      .withGuard('web')
      .loginAs(owner)

    olderRes.assertStatus(200)
    assert.deepEqual(
      olderRes.body().map((m: { id: number }) => m.id),
      [msg1.id]
    )
  })

  test('POST /channels/:channelId/kick bans after 3 member votes or immediately by owner, and owner invite unbans', async ({
    client,
    assert,
  }) => {
    const owner = await createTestUser('owner')
    const voter1 = await createTestUser('voter1')
    const voter2 = await createTestUser('voter2')
    const voter3 = await createTestUser('voter3')
    const target = await createTestUser('target')

    const createRes = await client
      .post('/channels/create')
      .withGuard('web')
      .loginAs(owner)
      .json({ name: 'arena', type: 'public' })
    const channelId = createRes.body().id

    for (const member of [voter1, voter2, voter3, target]) {
      await client.post('/channels/join').withGuard('web').loginAs(member).json({ name: 'arena' })
    }

    const vote1 = await client
      .post(`/channels/${channelId}/kick`)
      .withGuard('web')
      .loginAs(voter1)
      .json({ nick: target.nick })
    vote1.assertStatus(200)
    assert.deepEqual(vote1.body(), { banned: false, votes: 1 })

    const vote2 = await client
      .post(`/channels/${channelId}/kick`)
      .withGuard('web')
      .loginAs(voter2)
      .json({ nick: target.nick })
    vote2.assertStatus(200)
    assert.deepEqual(vote2.body(), { banned: false, votes: 2 })

    const vote3 = await client
      .post(`/channels/${channelId}/kick`)
      .withGuard('web')
      .loginAs(voter3)
      .json({ nick: target.nick })
    vote3.assertStatus(200)
    assert.deepEqual(vote3.body(), { banned: true, votes: 3 })

    // Banned user cannot rejoin on their own
    const rejoinRes = await client
      .post('/channels/join')
      .withGuard('web')
      .loginAs(target)
      .json({ name: 'arena' })
    rejoinRes.assertStatus(403)

    // Owner invite unbans the user
    const inviteRes = await client
      .post(`/channels/${channelId}/invite`)
      .withGuard('web')
      .loginAs(owner)
      .json({ nick: target.nick })
    inviteRes.assertStatus(201)
  })

  test('kick vote progress is member-only, persists distinct votes, and broadcasts changes', async ({
    client,
    assert,
  }) => {
    const owner = await createTestUser('owner')
    const voter = await createTestUser('voter')
    const target = await createTestUser('target')
    const outsider = await createTestUser('outsider')
    const channel = await Channel.createWithOwner(owner.id, `votes-${randomUUID()}`, 'public')
    await UserChannel.addMember(channel.id, voter.id)
    await UserChannel.addMember(channel.id, target.id)

    const forbidden = await client
      .get(`/channels/${channel.id}/kick-votes`)
      .withGuard('web')
      .loginAs(outsider)
    forbidden.assertStatus(403)

    const broadcast = socket.fake()
    try {
      for (const expected of [1, 1]) {
        const response = await client
          .post(`/channels/${channel.id}/kick`)
          .withGuard('web')
          .loginAs(voter)
          .json({ nick: target.nick })
        response.assertStatus(200)
        assert.deepEqual(response.body(), { banned: false, votes: expected })
      }

      broadcast.assertEmittedTo(`channels/${channel.id}`, 'kick:updated', {
        data: { channelId: channel.id },
      })

      const votes = await client
        .get(`/channels/${channel.id}/kick-votes`)
        .withGuard('web')
        .loginAs(voter)
      votes.assertStatus(200)
      assert.deepEqual(votes.body(), [
        { targetId: target.id, nick: target.nick, votes: 1, votedByMe: true },
      ])

      const ownerVotes = await client
        .get(`/channels/${channel.id}/kick-votes`)
        .withGuard('web')
        .loginAs(owner)
      assert.isFalse(ownerVotes.body()[0].votedByMe)

      const kick = await client
        .post(`/channels/${channel.id}/kick`)
        .withGuard('web')
        .loginAs(owner)
        .json({ nick: target.nick })
      kick.assertStatus(200)
      assert.isTrue(kick.body().banned)

      const empty = await client
        .get(`/channels/${channel.id}/kick-votes`)
        .withGuard('web')
        .loginAs(voter)
      assert.deepEqual(empty.body(), [])
      const banned = await client
        .get(`/channels/${channel.id}/kick-votes`)
        .withGuard('web')
        .loginAs(target)
      banned.assertStatus(403)
    } finally {
      broadcast.restore()
    }
  })

  test('POST /channels/:channelId/revoke removes a member from a private channel', async ({
    client,
    assert,
  }) => {
    const owner = await createTestUser('owner')
    const member = await createTestUser('member')

    const createRes = await client
      .post('/channels/create')
      .withGuard('web')
      .loginAs(owner)
      .json({ name: 'private-team', type: 'private' })
    const channelId = createRes.body().id

    await UserChannel.create({
      id: randomUUID(),
      channelId,
      userId: member.id,
      banned: false,
    })

    const presence = await app.container.make('socket.presence')
    const raw = { id: randomUUID(), data: {}, connection: {} as never }
    presence.join(`channels/${channelId}`, raw, { id: member.id })
    const disconnect = mock.fn()
    const getSocket = mock.method(socket, 'getSocket', () => ({ disconnect }) as never)
    const broadcast = socket.fake()

    try {
      const revokeRes = await client
        .post(`/channels/${channelId}/revoke`)
        .withGuard('web')
        .loginAs(owner)
        .json({ nick: member.nick })
      revokeRes.assertStatus(200)
      broadcast.assertEmittedTo(`user/${member.id}`, 'channels:changed', { data: { channelId } })
      assert.equal(disconnect.mock.callCount(), 1)
    } finally {
      broadcast.restore()
      getSocket.mock.restore()
      presence.leave(`channels/${channelId}`, raw)
    }

    const membersRes = await client
      .get(`/channels/${channelId}/members`)
      .withGuard('web')
      .loginAs(owner)
    assert.lengthOf(membersRes.body(), 1)
  })

  test('POST /channels/:channelId/leave removes member, and deletes channel when owner leaves', async ({
    client,
    assert,
  }) => {
    const owner = await createTestUser('owner')
    const member = await createTestUser('member')

    const createRes = await client
      .post('/channels/create')
      .withGuard('web')
      .loginAs(owner)
      .json({ name: 'temp-channel', type: 'public' })
    const channelId = createRes.body().id

    await client
      .post('/channels/join')
      .withGuard('web')
      .loginAs(member)
      .json({ name: 'temp-channel' })

    const memberLeave = await client
      .post(`/channels/${channelId}/leave`)
      .withGuard('web')
      .loginAs(member)
    memberLeave.assertStatus(200)

    const ownerLeave = await client
      .post(`/channels/${channelId}/leave`)
      .withGuard('web')
      .loginAs(owner)
    ownerLeave.assertStatus(200)

    const channelsList = await client.get('/channels').withGuard('web').loginAs(owner)
    assert.lengthOf(channelsList.body(), 0)
  })
})
