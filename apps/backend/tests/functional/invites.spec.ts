import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Channel from '#models/channel'
import Invite from '#models/invite'
import User from '#models/user'
import UserChannel from '#models/user_channel'

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

test.group('Invites endpoints (/invites)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /invites lists only pending invites for the authenticated user', async ({
    client,
    assert,
  }) => {
    const owner = await createTestUser('owner')
    const invitee = await createTestUser('invitee')
    const other = await createTestUser('other')
    const channel = await Channel.createWithOwner(owner.id, `room-${randomUUID()}`, 'private')
    const pending = await Invite.findOrCreatePending(channel.id, owner.id, invitee.id)
    await Invite.findOrCreatePending(channel.id, owner.id, other.id)

    const response = await client.get('/invites').withGuard('web').loginAs(invitee)
    response.assertStatus(200)
    const invites = response.body() as Array<{ id: string; channel: { id: string } }>
    assert.lengthOf(invites, 1)
    assert.equal(invites[0].id, pending.id)
    assert.equal(invites[0].channel.id, channel.id)
  })

  test('POST /invites accepts an invite and adds a member only once', async ({
    client,
    assert,
  }) => {
    const owner = await createTestUser('owner')
    const invitee = await createTestUser('invitee')
    const channel = await Channel.createWithOwner(owner.id, `room-${randomUUID()}`, 'private')
    const invite = await Invite.findOrCreatePending(channel.id, owner.id, invitee.id)

    const response = await client
      .post('/invites')
      .withGuard('web')
      .loginAs(invitee)
      .json({ inviteId: invite.id, action: 'accept' })

    response.assertStatus(200)
    assert.equal((response.body() as { status: string }).status, 'accepted')
    assert.isNotNull(await UserChannel.findActiveForUser(channel.id, invitee.id))

    const again = await client
      .post('/invites')
      .withGuard('web')
      .loginAs(invitee)
      .json({ inviteId: invite.id, action: 'accept' })
    again.assertStatus(404)
    assert.lengthOf(
      await UserChannel.query().where('channelId', channel.id).where('userId', invitee.id),
      1
    )
  })

  test('POST /invites rejects without adding membership', async ({ client, assert }) => {
    const owner = await createTestUser('owner')
    const invitee = await createTestUser('invitee')
    const channel = await Channel.createWithOwner(owner.id, `room-${randomUUID()}`, 'private')
    const invite = await Invite.findOrCreatePending(channel.id, owner.id, invitee.id)

    const response = await client
      .post('/invites')
      .withGuard('web')
      .loginAs(invitee)
      .json({ inviteId: invite.id, action: 'reject' })

    response.assertStatus(200)
    assert.equal((response.body() as { status: string }).status, 'rejected')
    assert.isNull(await UserChannel.findForUser(channel.id, invitee.id))

    const pending = await client.get('/invites').withGuard('web').loginAs(invitee)
    pending.assertStatus(200)
    assert.lengthOf(pending.body() as unknown[], 0)
  })

  test('POST /invites cannot process another user’s invite or invalid input', async ({
    client,
    assert,
  }) => {
    const owner = await createTestUser('owner')
    const invitee = await createTestUser('invitee')
    const other = await createTestUser('other')
    const channel = await Channel.createWithOwner(owner.id, `room-${randomUUID()}`, 'private')
    const invite = await Invite.findOrCreatePending(channel.id, owner.id, invitee.id)

    const forbidden = await client
      .post('/invites')
      .withGuard('web')
      .loginAs(other)
      .json({ inviteId: invite.id, action: 'accept' })
    forbidden.assertStatus(404)

    const invalid = await client
      .post('/invites')
      .withGuard('web')
      .loginAs(invitee)
      .json({ inviteId: invite.id, action: 'maybe' })
    invalid.assertStatus(422)
    const pendingInvite = await Invite.findOrFail(invite.id)
    assert.equal(pendingInvite.status, 'pending')
    assert.isNull(await UserChannel.findForUser(channel.id, invitee.id))
  })

  test('POST /invites cannot accept when membership already exists or is banned', async ({
    client,
    assert,
  }) => {
    const owner = await createTestUser('owner')
    const invitee = await createTestUser('invitee')
    const channel = await Channel.createWithOwner(owner.id, `room-${randomUUID()}`, 'private')
    const invite = await Invite.findOrCreatePending(channel.id, owner.id, invitee.id)
    const membership = await UserChannel.addMember(channel.id, invitee.id)

    const accept = () =>
      client
        .post('/invites')
        .withGuard('web')
        .loginAs(invitee)
        .json({ inviteId: invite.id, action: 'accept' })

    const existing = await accept()
    existing.assertStatus(409)

    await membership.markBanned()
    const banned = await accept()
    banned.assertStatus(403)
    const pendingInvite = await Invite.findOrFail(invite.id)
    assert.equal(pendingInvite.status, 'pending')
  })
})
