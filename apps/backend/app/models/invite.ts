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
}
