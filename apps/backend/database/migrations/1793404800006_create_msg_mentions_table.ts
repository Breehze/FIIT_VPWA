import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'msg_mentions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('mentioned_id').notNullable().references('id').inTable('users')
      table.integer('msg_id').notNullable().references('id').inTable('msgs')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
