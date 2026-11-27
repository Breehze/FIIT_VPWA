import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('user_channels', (table) => {
      table.unique(['channel_id', 'user_id'], 'user_channels_channel_user_unique')
    })
  }

  async down() {
    this.schema.alterTable('user_channels', (table) => {
      table.dropUnique(['channel_id', 'user_id'], 'user_channels_channel_user_unique')
    })
  }
}
