import { randomUUID } from 'node:crypto'
import { mock } from 'node:test'
import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import socket from '@rlanz/socket/services/main'
import Channel from '#models/channel'
import Invite from '#models/invite'
import Msg from '#models/msg'
import User from '#models/user'
import UserChannel from '#models/user_channel'
import ChannelService from '#services/channel_service'

test.group('Inactive channel cleanup', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('deletes channels inactive for over 30 days, their messages and memberships, and notifies members', async ({
    assert,
  }) => {
    const unique = randomUUID()
    const owner = await User.create({
      id: randomUUID(),
      name: 'Owner',
      lastName: 'Test',
      nick: `owner_${unique}`,
      email: `owner_${unique}@example.com`,
      password: 'password123',
      state: 'Online',
      mentionOnlyNotif: false,
    })

    const expired = await Channel.createWithOwner(owner.id, 'old-room', 'public')
    const active = await Channel.createWithOwner(owner.id, 'active-room', 'private')
    const invitee = await User.create({
      id: randomUUID(),
      name: 'Invitee',
      lastName: 'Test',
      nick: `invitee_${unique}`,
      email: `invitee_${unique}@example.com`,
      password: 'password123',
      state: 'Online',
      mentionOnlyNotif: false,
    })
    const invite = await Invite.findOrCreatePending(expired.id, owner.id, invitee.id)
    const oldMessage = await Msg.create({
      channelId: expired.id,
      senderId: owner.id,
      contentType: 'text',
      textContent: 'An old message',
      createdAt: DateTime.now().minus({ days: 31 }),
    })
    await expired.merge({ lastActivity: DateTime.now().minus({ days: 31 }) }).save()
    await active.merge({ lastActivity: DateTime.now().minus({ days: 29 }) }).save()

    // Expired channels disappear from user lists even before the hourly sweep runs.
    const visibleChannels = await Channel.listForUser(owner.id)
    assert.deepEqual(
      visibleChannels.map((channel) => channel.id),
      [active.id]
    )

    const broadcast = socket.fake()
    try {
      const service = new ChannelService()
      assert.equal(await service.pruneExpiredChannels(), 1)
      broadcast.assertEmittedTo(`user/${owner.id}`, 'channels:changed', {
        data: { channelId: expired.id },
      })
      assert.isNull(await Channel.find(expired.id))
      assert.isNull(await Msg.find(oldMessage.id))
      assert.isNull(await Invite.find(invite.id))
      assert.isNull(await UserChannel.findForUser(expired.id, owner.id))
      assert.isNotNull(await Channel.find(active.id))
      assert.equal(await service.pruneExpiredChannels(), 0)

      const replacement = await service.createChannel(owner.id, 'old-room', 'public')
      assert.notEqual(replacement.id, expired.id)
    } finally {
      broadcast.restore()
    }
  })

  test('rechecks activity after selecting an expired candidate before deleting it', async ({
    assert,
  }) => {
    const unique = randomUUID()
    const owner = await User.create({
      id: randomUUID(),
      name: 'Owner',
      lastName: 'Test',
      nick: `owner_${unique}`,
      email: `owner_${unique}@example.com`,
      password: 'password123',
      state: 'Online',
      mentionOnlyNotif: false,
    })
    const room = await Channel.createWithOwner(owner.id, `race-${unique}`, 'public')
    await room.merge({ lastActivity: DateTime.now().minus({ days: 31 }) }).save()

    const originalTransaction = db.transaction.bind(db)
    const entered = Promise.withResolvers<void>()
    const resume = Promise.withResolvers<void>()
    const transaction = mock.method(
      db,
      'transaction',
      async (callback: Parameters<typeof db.transaction>[0]) => {
        entered.resolve()
        await resume.promise
        return originalTransaction(callback)
      }
    )

    try {
      const pruning = new ChannelService().pruneExpiredChannels()
      await entered.promise // The sweep has already selected this room as expired.

      // Simulate a committed message updating activity while the sweep is in flight.
      await Msg.create({
        channelId: room.id,
        senderId: owner.id,
        contentType: 'text',
        textContent: 'New activity',
      })
      await room.merge({ lastActivity: DateTime.now() }).save()
      resume.resolve()

      assert.equal(await pruning, 0)
      assert.isNotNull(await Channel.find(room.id))
      assert.lengthOf(await Msg.query().where('channelId', room.id), 1)
    } finally {
      resume.resolve()
      transaction.mock.restore()
    }
  })
})
