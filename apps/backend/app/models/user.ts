import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { column } from '@adonisjs/lucid/orm'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  // These existing database columns use camelCase rather than Lucid's snake_case default.
  @column({ columnName: 'lastName' })
  declare lastName: string | null

  @column({ columnName: 'mentionOnlyNotif' })
  declare mentionOnlyNotif: boolean

  get initials() {
    const first = this.name?.trim()
    const last = this.lastName?.trim()
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return (first || last || this.nick?.trim() || this.email.split('@')[0])
      .slice(0, 2)
      .toUpperCase()
  }
}
