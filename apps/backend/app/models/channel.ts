import { ChannelSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import User from '#models/user'
import UserChannel from '#models/user_channel'
import Msg from '#models/msg'
import Invite from '#models/invite'
import VoteKick from '#models/vote_kick'

export default class Channel extends ChannelSchema {
  @belongsTo(() => User, {
    foreignKey: 'owner',
  })
  declare ownerUser: BelongsTo<typeof User>

  @hasMany(() => UserChannel, {
    foreignKey: 'channelId',
  })
  declare memberships: HasMany<typeof UserChannel>

  @hasMany(() => Msg, {
    foreignKey: 'channelId',
  })
  declare messages: HasMany<typeof Msg>

  @hasMany(() => Invite, {
    foreignKey: 'channelId',
  })
  declare invites: HasMany<typeof Invite>

  @hasMany(() => VoteKick, {
    foreignKey: 'channelId',
  })
  declare voteKicks: HasMany<typeof VoteKick>
}
