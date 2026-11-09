import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('Login', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('authenticates with a hashed password', async ({ client }) => {
    const email = `login_${randomUUID()}@example.com`
    await User.create({
      id: randomUUID(),
      nick: `login_${randomUUID()}`,
      email,
      password: 'password123',
      state: 'Online',
      mentionOnlyNotif: false,
    })

    const response = await client.post('/login').json({ email, password: 'password123' })
    response.assertStatus(200)
  })
})
