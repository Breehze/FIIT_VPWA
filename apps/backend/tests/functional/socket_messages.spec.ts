import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import socketService from '@rlanz/socket/services/main'
import type { AuthenticatedSocket, MiddlewareContext } from '@rlanz/socket/types'
import MessagesChannel from '#channels/messages_channel'
import UserUpdatesChannel from '#channels/user_updates_channel'
import ChannelService from '#services/channel_service'
import Channel from '#models/channel'
import Invite from '#models/invite'
import Msg from '#models/msg'
import User from '#models/user'
import UserChannel from '#models/user_channel'

async function createUser(): Promise<User> {
  const unique = randomUUID().slice(0, 8)
  return User.create({
    id: randomUUID(),
    name: 'Socket',
    lastName: 'Test',
    nick: `socket_${unique}`,
    email: `socket_${unique}@example.com`,
    password: 'password123',
    state: 'Online',
    mentionOnlyNotif: false,
  })
}

test.group('Socket messages', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('saves and broadcasts a text message from a member', async ({ assert }) => {
    const owner = await createUser()
    const room = await Channel.createWithOwner(owner.id, `socket-${randomUUID()}`, 'public')
    const events: Array<{ event: string; data: unknown }> = []
    const channel = new MessagesChannel()
    channel.$setContext(
      {
        to: () => ({
          emit: (event, data) => events.push({ event, data }),
          except: () => ({ emit: () => {} }),
        }),
      },
      `channels/${room.id}`,
      { channelId: room.id }
    )
    const socket = { getUserOrFail: () => owner } as AuthenticatedSocket<User>

    const message = await channel.send(socket, { text: '  Hello!  ' })

    assert.equal(message.textContent, 'Hello!')
    assert.equal(message.senderId, owner.id)
    const saved = await Msg.findOrFail(message.id)
    assert.equal(saved.textContent, 'Hello!')
    assert.deepEqual(events, [{ event: 'message:created', data: message }])
  })

  test('rejects non-members and invalid messages without saving', async ({ assert }) => {
    const owner = await createUser()
    const outsider = await createUser()
    const room = await Channel.createWithOwner(owner.id, `socket-${randomUUID()}`, 'public')
    const channel = new MessagesChannel()
    channel.$setContext(
      { to: () => ({ emit: () => {}, except: () => ({ emit: () => {} }) }) },
      `channels/${room.id}`,
      { channelId: room.id }
    )

    await assert.rejects(
      () =>
        channel.send({ getUserOrFail: () => outsider } as AuthenticatedSocket<User>, {
          text: 'Hi',
        }),
      'Not a member of this channel'
    )
    await assert.rejects(
      () =>
        channel.send({ getUserOrFail: () => owner } as AuthenticatedSocket<User>, { text: '   ' }),
      'Message must be between 1 and 4000 characters'
    )
    assert.lengthOf(await Msg.query().where('channelId', room.id), 0)

    const membership = await UserChannel.findForUser(room.id, owner.id)
    await membership!.markBanned()
    await assert.rejects(
      () =>
        channel.send({ getUserOrFail: () => owner } as AuthenticatedSocket<User>, { text: 'Hi' }),
      'Not a member of this channel'
    )
  })

  test('only active members can subscribe to a message channel', async ({ assert }) => {
    const owner = await createUser()
    const outsider = await createUser()
    const room = await Channel.createWithOwner(owner.id, `socket-${randomUUID()}`, 'public')
    const authorize = MessagesChannel.middlewares[0]
    let subscribed = false
    const ctx: MiddlewareContext<User> = {
      channel: `channels/${room.id}`,
      params: { channelId: room.id },
      socket: { getUserOrFail: () => outsider } as AuthenticatedSocket<User>,
      setPresenceData: () => {},
    }
    const next = async () => {
      subscribed = true
    }

    await assert.rejects(() => authorize(ctx, next), 'Not a member of this channel')
    assert.isFalse(subscribed)

    ctx.socket = { getUserOrFail: () => owner } as AuthenticatedSocket<User>
    await authorize(ctx, next)
    assert.isTrue(subscribed)

    const membership = await UserChannel.findForUser(room.id, owner.id)
    await membership!.markBanned()
    subscribed = false
    await assert.rejects(() => authorize(ctx, next), 'Not a member of this channel')
    assert.isFalse(subscribed)
  })
})

test.group('Socket user updates', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('pushes an invite after creating it', async ({ assert }) => {
    const sender = await createUser()
    const recipient = await createUser()
    const room = await Channel.createWithOwner(sender.id, `socket-${randomUUID()}`, 'private')
    const broadcast = socketService.fake()

    try {
      const invite = await new ChannelService().inviteMember(sender.id, room.id, recipient.nick)
      assert.equal(invite.inviteeId, recipient.id)
      broadcast.assertEmittedTo(`user/${recipient.id}`, 'invite:created', {
        data: invite.serialize(),
      })
    } finally {
      broadcast.restore()
    }
  })

  test('lists pending invites for the subscribed user', async ({ assert }) => {
    const sender = await createUser()
    const recipient = await createUser()
    const other = await createUser()
    const room = await Channel.createWithOwner(sender.id, `socket-${randomUUID()}`, 'private')
    const invite = await Invite.findOrCreatePending(room.id, sender.id, recipient.id)
    await Invite.findOrCreatePending(room.id, sender.id, other.id)

    const authorize = UserUpdatesChannel.middlewares[0]
    let subscribed = false
    const ctx: MiddlewareContext<User> = {
      channel: `user/${recipient.id}`,
      params: { userId: recipient.id },
      socket: { getUserOrFail: () => other } as AuthenticatedSocket<User>,
      setPresenceData: () => {},
    }
    const next = async () => {
      subscribed = true
    }

    await assert.rejects(() => authorize(ctx, next), 'Not your user channel')
    assert.isFalse(subscribed)

    ctx.socket = { getUserOrFail: () => recipient } as AuthenticatedSocket<User>
    await authorize(ctx, next)
    assert.isTrue(subscribed)

    const channel = new UserUpdatesChannel()
    channel.$setContext({} as never, `user/${recipient.id}`, { userId: recipient.id })
    const result = await channel.list(ctx.socket)
    const invites = result.invites
    assert.lengthOf(invites, 1)
    assert.equal(invites[0].id, invite.id)
    assert.equal(invites[0].channelId, room.id)
    assert.exists(invites[0].channel)

    await assert.rejects(
      () => channel.list({ getUserOrFail: () => other } as AuthenticatedSocket<User>),
      'Not your user channel'
    )
  })
})

test.group('Socket subscriptions', () => {
  test('presence exposes the authenticated member identity', ({ assert }) => {
    const channel = new MessagesChannel()
    const user = { id: 'alice', nick: 'Alice' } as User
    const socket = { getUserOrFail: () => user } as AuthenticatedSocket<User>

    assert.isTrue(MessagesChannel.options.presence)
    assert.deepEqual(channel.getPresenceInfo(socket), { id: 'alice', data: { nick: 'Alice' } })
  })
})
