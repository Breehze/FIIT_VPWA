import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'msgs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.uuid('channel_id').notNullable().references('id').inTable('channels')
      table.uuid('sender_id').nullable().references('id').inTable('users')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.enu('content_type', ['text', 'file', 'img']).notNullable()
      table.text('text_content').nullable()
      table.string('cdn_link', 2048).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
