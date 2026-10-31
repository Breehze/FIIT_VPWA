import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'vote_kick_voters'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('vote_kick_id').notNullable().references('id').inTable('vote_kicks')
      table.uuid('user_id').notNullable().references('id').inTable('users')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
