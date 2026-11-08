import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
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

  static async addVoteAndCount(
    channelId: string,
    targetId: string,
    voterId: string
  ): Promise<number> {
    let voteKick = await this.query()
      .where('channelId', channelId)
      .where('targetId', targetId)
      .first()

    if (!voteKick) {
      voteKick = await this.create({
        id: randomUUID(),
        channelId,
        targetId,
        createdAt: DateTime.now(),
      })
    }

    const existingVote = await VoteKickVoter.query()
      .where('voteKickId', voteKick.id)
      .where('userId', voterId)
      .first()

    if (!existingVote) {
      await VoteKickVoter.create({
        id: randomUUID(),
        voteKickId: voteKick.id,
        userId: voterId,
      })
    }

    const voters = await VoteKickVoter.query().where('voteKickId', voteKick.id)
    return voters.length
  }

  static async clearForTarget(channelId: string, targetId: string): Promise<void> {
    const voteKickSubquery = this.query()
      .where('channelId', channelId)
      .where('targetId', targetId)
      .select('id')

    await VoteKickVoter.query().whereIn('voteKickId', voteKickSubquery).delete()
    await this.query().where('channelId', channelId).where('targetId', targetId).delete()
  }
}
