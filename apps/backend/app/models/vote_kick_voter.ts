import { VoteKickVoterSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import User from '#models/user'
import VoteKick from '#models/vote_kick'

export default class VoteKickVoter extends VoteKickVoterSchema {
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => VoteKick, {
    foreignKey: 'voteKickId',
  })
  declare voteKick: BelongsTo<typeof VoteKick>
}
