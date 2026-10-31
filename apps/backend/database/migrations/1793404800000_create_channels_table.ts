import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('owner').notNullable().references('id').inTable('users')
      table.string('name', 255).notNullable()
      table.enu('type', ['public', 'private']).notNullable()
      table.timestamp('last_activity', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
