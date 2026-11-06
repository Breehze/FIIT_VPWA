import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import Channel from '#models/channel'
import UserChannel from '#models/user_channel'
import Msg from '#models/msg'
import MsgMention from '#models/msg_mention'
import Invite from '#models/invite'
import VoteKick from '#models/vote_kick'
import VoteKickVoter from '#models/vote_kick_voter'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  // These existing database columns use camelCase rather than Lucid's snake_case default.
  @column({ columnName: 'lastName' })
  declare lastName: string | null

  @column({ columnName: 'mentionOnlyNotif' })
  declare mentionOnlyNotif: boolean

  @hasMany(() => Channel, {
    foreignKey: 'owner',
  })
  declare ownedChannels: HasMany<typeof Channel>

  @hasMany(() => UserChannel, {
    foreignKey: 'userId',
  })
  declare channelMemberships: HasMany<typeof UserChannel>

  @hasMany(() => Msg, {
    foreignKey: 'senderId',
  })
  declare messages: HasMany<typeof Msg>

  @hasMany(() => MsgMention, {
    foreignKey: 'mentionedId',
  })
  declare mentions: HasMany<typeof MsgMention>

  @hasMany(() => Invite, {
    foreignKey: 'inviterId',
  })
  declare sentInvites: HasMany<typeof Invite>

  @hasMany(() => Invite, {
    foreignKey: 'inviteeId',
  })
  declare receivedInvites: HasMany<typeof Invite>

  @hasMany(() => VoteKick, {
    foreignKey: 'targetId',
  })
  declare voteKicksAgainst: HasMany<typeof VoteKick>

  @hasMany(() => VoteKickVoter, {
    foreignKey: 'userId',
  })
  declare voteKickVotes: HasMany<typeof VoteKickVoter>

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
