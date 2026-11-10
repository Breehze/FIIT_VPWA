import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { ChannelSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import User from '#models/user'
import UserChannel from '#models/user_channel'
import Msg from '#models/msg'
import MsgMention from '#models/msg_mention'
import Invite from '#models/invite'
import VoteKick from '#models/vote_kick'
import VoteKickVoter from '#models/vote_kick_voter'

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

  static normalizeName(rawName: string): string {
    return rawName.trim().replace(/^#/, '')
  }

  static async listForUser(userId: string): Promise<Channel[]> {
    return this.query()
      .where('lastActivity', '>=', DateTime.now().minus({ days: 30 }).toJSDate())
      .whereHas('memberships', (query) => {
        query.where('userId', userId).where('banned', false)
      })
      .orderBy('lastActivity', 'desc')
  }

  static async findByName(rawName: string): Promise<Channel | null> {
    const name = this.normalizeName(rawName)
    return this.query().whereILike('name', name).first()
  }

  static async createWithOwner(
    ownerId: string,
    rawName: string,
    type: 'public' | 'private'
  ): Promise<Channel> {
    const name = this.normalizeName(rawName)
    const now = DateTime.now()

    return db.transaction(async (trx) => {
      const channel = await this.create(
        {
          id: randomUUID(),
          name,
          type,
          owner: ownerId,
          lastActivity: now,
          createdAt: now,
        },
        { client: trx }
      )

      await UserChannel.create(
        {
          id: randomUUID(),
          channelId: channel.id,
          userId: ownerId,
          banned: false,
        },
        { client: trx }
      )

      return channel
    })
  }

  isExpired(inactiveDaysLimit = 30): boolean {
    const cutoff = DateTime.now().minus({ days: inactiveDaysLimit })
    return this.lastActivity < cutoff
  }

  async deleteWithRelations(transaction?: TransactionClientContract): Promise<void> {
    const deleteRelations = async (trx: TransactionClientContract) => {
      const msgSubquery = Msg.query({ client: trx }).where('channelId', this.id).select('id')
      await MsgMention.query({ client: trx }).whereIn('msgId', msgSubquery).delete()
      await Msg.query({ client: trx }).where('channelId', this.id).delete()

      const voteKickSubquery = VoteKick.query({ client: trx })
        .where('channelId', this.id)
        .select('id')
      await VoteKickVoter.query({ client: trx }).whereIn('voteKickId', voteKickSubquery).delete()
      await VoteKick.query({ client: trx }).where('channelId', this.id).delete()

      await Invite.query({ client: trx }).where('channelId', this.id).delete()
      await UserChannel.query({ client: trx }).where('channelId', this.id).delete()
      await Channel.query({ client: trx }).where('id', this.id).delete()
    }

    if (transaction) {
      await deleteRelations(transaction)
    } else {
      await db.transaction(deleteRelations)
    }
  }
}
