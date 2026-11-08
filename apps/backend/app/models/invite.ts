import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { InviteSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import Channel from '#models/channel'
import User from '#models/user'

export default class Invite extends InviteSchema {
  @belongsTo(() => Channel, {
    foreignKey: 'channelId',
  })
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, {
    foreignKey: 'inviterId',
  })
  declare inviter: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'inviteeId',
  })
  declare invitee: BelongsTo<typeof User>

  static async findOrCreatePending(
    channelId: string,
    inviterId: string,
    inviteeId: string
  ): Promise<Invite> {
    const existing = await this.query()
      .where('channelId', channelId)
      .where('inviteeId', inviteeId)
      .where('status', 'pending')
      .first()

    if (existing) {
      return existing
    }

    return this.create({
      id: randomUUID(),
      channelId,
      inviterId,
      inviteeId,
      status: 'pending',
      createdAt: DateTime.now(),
    })
  }
}
