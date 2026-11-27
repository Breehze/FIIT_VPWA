import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import Channel from '#models/channel'
import User from '#models/user'
import UserChannel from '#models/user_channel'

test.group('Concurrent channel memberships', () => {
  // Real commits/separate connections are required to exercise unique conflicts.
  // A global rollback transaction would serialize all requests on one connection.
  test('parallel joins create one membership and cannot overwrite a ban', async ({
    client,
    assert,
  }) => {
    const users: User[] = []
    let room: Channel | undefined
    try {
      for (const prefix of ['owner', 'member']) {
        const id = randomUUID()
        users.push(
          await User.create({
            id,
            name: prefix,
            lastName: 'Concurrency',
            nick: `${prefix}_${id.slice(0, 8)}`,
            email: `${id}@example.com`,
            password: 'password123',
            state: 'Online',
            mentionOnlyNotif: false,
          })
        )
      }
      const [owner, member] = users as [User, User]
      room = await Channel.createWithOwner(owner.id, `race-${randomUUID()}`, 'public')
      const channelId = room.id

      // Exercise the transactional insertion used by invitation acceptance too.
      const inserts = await Promise.allSettled(
        Array.from({ length: 6 }, () =>
          db.transaction((trx) => UserChannel.addMember(channelId, member.id, trx))
        )
      )
      for (const result of inserts) {
        assert.equal(result.status, 'fulfilled')
      }
      let memberships = await UserChannel.query()
        .where('channelId', channelId)
        .where('userId', member.id)
      assert.lengthOf(memberships, 1)

      // Direct writes are also protected, even if they bypass addMember().
      await assert.rejects(
        () => UserChannel.create({ id: randomUUID(), channelId, userId: member.id, banned: false }),
        /user_channels_channel_user_unique/
      )
      await memberships[0]!.delete()

      const joins = await Promise.allSettled(
        Array.from({ length: 6 }, () =>
          client.post('/channels/join').withGuard('web').loginAs(member).json({ name: room!.name })
        )
      )
      for (const result of joins) {
        assert.equal(result.status, 'fulfilled')
        if (result.status === 'fulfilled') result.value.assertStatus(200)
      }
      memberships = await UserChannel.query()
        .where('channelId', channelId)
        .where('userId', member.id)
      assert.lengthOf(memberships, 1)
      const membership = memberships[0]!
      await membership.markBanned()

      await assert.rejects(
        () => db.transaction((trx) => UserChannel.addMember(channelId, member.id, trx)),
        'You are banned from this channel'
      )
      const rejoin = await client
        .post('/channels/join')
        .withGuard('web')
        .loginAs(member)
        .json({ name: room.name })
      rejoin.assertStatus(403)
      await membership.refresh()
      assert.isTrue(membership.banned)
      assert.lengthOf(
        await UserChannel.query().where('channelId', channelId).where('userId', member.id),
        1
      )
    } finally {
      if (room) await room.deleteWithRelations()
      for (const user of users) await user.delete()
    }
  }).timeout(15_000)
})
