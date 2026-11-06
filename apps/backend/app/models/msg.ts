import { MsgSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import User from '#models/user'
import Channel from '#models/channel'
import MsgMention from '#models/msg_mention'

export default class Msg extends MsgSchema {
  @belongsTo(() => User, {
    foreignKey: 'senderId',
  })
  declare sender: BelongsTo<typeof User>

  @belongsTo(() => Channel, {
    foreignKey: 'channelId',
  })
  declare channel: BelongsTo<typeof Channel>

  @hasMany(() => MsgMention, {
    foreignKey: 'msgId',
  })
  declare mentions: HasMany<typeof MsgMention>
}
