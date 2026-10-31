import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invites'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('inviter_id').notNullable().references('id').inTable('users')
      table.uuid('invitee_id').notNullable().references('id').inTable('users')
      table.uuid('channel_id').notNullable().references('id').inTable('channels')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.enu('status', ['accepted', 'pending', 'rejected']).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
