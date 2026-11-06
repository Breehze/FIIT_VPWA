import { VoteKickSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import Channel from '#models/channel'
import User from '#models/user'
import VoteKickVoter from '#models/vote_kick_voter'

export default class VoteKick extends VoteKickSchema {
  @belongsTo(() => Channel, {
    foreignKey: 'channelId',
  })
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, {
    foreignKey: 'targetId',
  })
  declare target: BelongsTo<typeof User>

  @hasMany(() => VoteKickVoter, {
    foreignKey: 'voteKickId',
  })
  declare voters: HasMany<typeof VoteKickVoter>
}
