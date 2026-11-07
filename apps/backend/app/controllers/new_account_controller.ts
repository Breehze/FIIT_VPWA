import { randomUUID } from 'node:crypto'
import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class NewAccountController {
  async store({ request, serialize }: HttpContext) {
    const { name, lastName, nick, email, password } = await request.validateUsing(signupValidator)

    const user = await User.create({
      id: randomUUID(),
      name: name ?? null,
      lastName: lastName ?? null,
      nick,
      email,
      password,
      state: 'Online',
      mentionOnlyNotif: false,
    })

    return serialize({
      user: UserTransformer.transform(user),
    })
  }
}
