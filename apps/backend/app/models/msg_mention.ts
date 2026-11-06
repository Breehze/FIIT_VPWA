import { MsgMentionSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import User from '#models/user'
import Msg from '#models/msg'

export default class MsgMention extends MsgMentionSchema {
  @belongsTo(() => Msg, {
    foreignKey: 'msgId',
  })
  declare message: BelongsTo<typeof Msg>

  @belongsTo(() => User, {
    foreignKey: 'mentionedId',
  })
  declare mentionedUser: BelongsTo<typeof User>
}
