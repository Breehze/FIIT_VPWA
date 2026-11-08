import { randomUUID } from 'node:crypto'
import { Exception } from '@adonisjs/core/exceptions'
import { UserChannelSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import User from '#models/user'
import Channel from '#models/channel'

export default class UserChannel extends UserChannelSchema {
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Channel, {
    foreignKey: 'channelId',
  })
  declare channel: BelongsTo<typeof Channel>

  static async findForUser(
    channelId: string,
    userId: string,
    trx?: TransactionClientContract
  ): Promise<UserChannel | null> {
    return this.query(trx ? { client: trx } : {})
      .where('channelId', channelId)
      .where('userId', userId)
      .first()
  }

  static async findActiveForUser(channelId: string, userId: string): Promise<UserChannel | null> {
    return this.query()
      .where('channelId', channelId)
      .where('userId', userId)
      .where('banned', false)
      .first()
  }

  static async requireActiveForUser(
    channelId: string,
    userId: string,
    errorStatus = 403
  ): Promise<UserChannel> {
    const membership = await this.findActiveForUser(channelId, userId)
    if (!membership) {
      throw new Exception('User is not an active member of this channel', { status: errorStatus })
    }
    return membership
  }

  static async addMember(
    channelId: string,
    userId: string,
    trx?: TransactionClientContract
  ): Promise<UserChannel> {
    return this.create(
      {
        id: randomUUID(),
        channelId,
        userId,
        banned: false,
      },
      trx ? { client: trx } : {}
    )
  }

  async markBanned(): Promise<void> {
    this.banned = true
    await this.save()
  }
}
