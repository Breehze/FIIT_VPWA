import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User from '#models/user'

const DEFAULT_DEMO_USER_ID = '123e4567-e89b-12d3-a456-426614174000'

/**
 * Temporary stub authentication middleware while real session auth is being built.
 * Resolves a User via:
 *   1. `x-user-id` header
 *   2. `x-user-nick` header
 *   3. Default seeded user (`john`) or the first user in the database
 */
export default class StubAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const headerUserId = ctx.request.header('x-user-id')
    const headerUserNick = ctx.request.header('x-user-nick')

    let user: User | null = null

    if (headerUserId) {
      user = await User.find(headerUserId)
    } else if (headerUserNick) {
      user = await User.findBy('nick', headerUserNick)
    } else {
      user = (await User.find(DEFAULT_DEMO_USER_ID)) ?? (await User.first())
    }

    if (!user) {
      return ctx.response.unauthorized({
        message: 'Stub auth user not found. Make sure the database is seeded.',
      })
    }

    ctx.user = user
    return next()
  }
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    user: User
  }
}
