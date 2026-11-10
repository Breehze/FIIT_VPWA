import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw('CREATE UNIQUE INDEX channels_name_lower_unique ON channels (lower(name))')
  }

  async down() {
    this.schema.raw('DROP INDEX channels_name_lower_unique')
  }
}
