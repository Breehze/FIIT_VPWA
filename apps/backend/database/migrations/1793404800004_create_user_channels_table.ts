import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_channels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('channel_id').notNullable().references('id').inTable('channels')
      table.uuid('user_id').notNullable().references('id').inTable('users')
      table.boolean('banned').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
