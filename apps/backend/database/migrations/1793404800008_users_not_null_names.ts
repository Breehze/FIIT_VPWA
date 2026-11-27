import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.raw(
      `UPDATE users SET name = COALESCE(NULLIF(btrim(name), ''), nick) WHERE name IS NULL OR btrim(name) = ''`
    )
    this.schema.raw(`UPDATE users SET "lastName" = '' WHERE "lastName" IS NULL`)
    this.schema.alterTable(this.tableName, (table) => {
      table.string('name').notNullable().alter()
      table.string('lastName').notNullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('name').nullable().alter()
      table.string('lastName').nullable().alter()
    })
  }
}
