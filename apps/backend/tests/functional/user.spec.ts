import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import socket from '@rlanz/socket/services/main'
import User from '#models/user'

test.group('User endpoints (/user)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /user returns the authenticated user', async ({ client, assert }) => {
    const user = await User.create({
      id: randomUUID(),
      name: 'Test',
      lastName: 'User',
      nick: `tester_${Date.now()}`,
      email: `tester_${Date.now()}@example.com`,
      password: 'password123',
      state: 'Online',
      mentionOnlyNotif: false,
    })

    const response = await client.get('/user').withGuard('web').loginAs(user)

    response.assertStatus(200)
    assert.equal(response.body().id, user.id)
    assert.equal(response.body().nick, user.nick)
    assert.equal(response.body().state, 'Online')
    assert.equal(response.body().mentionOnlyNotif, false)
  })

  test('POST /user/set_status updates the user status', async ({ client, assert }) => {
    const broadcast = socket.fake()
    try {
      const user = await User.create({
        id: randomUUID(),
        name: 'Test',
        lastName: 'User',
        nick: `status_${Date.now()}`,
        email: `status_${Date.now()}@example.com`,
        password: 'password123',
        state: 'Online',
        mentionOnlyNotif: false,
      })

      const response = await client
        .post('/user/set_status')
        .withGuard('web')
        .loginAs(user)
        .json({ status: 'DND' })

      response.assertStatus(200)
      assert.equal(response.body().state, 'DND')

      await user.refresh()
      assert.equal(user.state, 'DND')
      broadcast.assertEmittedTo('users/online', 'user:status', {
        data: { userId: user.id, state: 'DND' },
      })
    } finally {
      broadcast.restore()
    }
  })

  test('POST /user/set_status rejects invalid status values', async ({ client }) => {
    const user = await User.create({
      id: randomUUID(),
      name: 'Test',
      lastName: 'User',
      nick: `invalid_${Date.now()}`,
      email: `invalid_${Date.now()}@example.com`,
      password: 'password123',
      state: 'Online',
      mentionOnlyNotif: false,
    })

    const response = await client
      .post('/user/set_status')
      .withGuard('web')
      .loginAs(user)
      .json({ status: 'Busy' })

    response.assertStatus(422)
  })

  test('POST /user/set_mention_only_notif updates mentionOnlyNotif flag', async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      id: randomUUID(),
      name: 'Test',
      lastName: 'User',
      nick: `notif_${Date.now()}`,
      email: `notif_${Date.now()}@example.com`,
      password: 'password123',
      state: 'Online',
      mentionOnlyNotif: false,
    })

    const response = await client
      .post('/user/set_mention_only_notif')
      .withGuard('web')
      .loginAs(user)
      .json({ notif_only: true })

    response.assertStatus(200)
    assert.equal(response.body().mentionOnlyNotif, true)

    await user.refresh()
    assert.isTrue(user.mentionOnlyNotif)
  })
})
