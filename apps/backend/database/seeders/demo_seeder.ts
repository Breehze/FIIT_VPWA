import { randomUUID } from 'node:crypto'
import hash from '@adonisjs/core/services/hash'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

const users = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John',
    lastName: 'Doe',
    nick: 'john',
    email: 'john@example.com',
    state: 'Online',
  },
  {
    id: '999e4567-e89b-12d3-a456-426614174999',
    name: 'Alice',
    lastName: 'Smith',
    nick: 'alice',
    email: 'alice@example.com',
    state: 'Offline',
  },
  {
    id: '888e4567-e89b-12d3-a456-426614174888',
    name: 'Bob',
    lastName: 'Jones',
    nick: 'bob',
    email: 'bob@example.com',
    state: 'DND',
  },
  {
    id: '777e4567-e89b-12d3-a456-426614174777',
    name: 'Charlie',
    lastName: 'Brown',
    nick: 'charlie',
    email: 'charlie@example.com',
    state: 'Online',
  },
  {
    id: '666e4567-e89b-12d3-a456-426614174666',
    name: 'Diana',
    lastName: 'Prince',
    nick: 'diana',
    email: 'diana@example.com',
    state: 'Online',
  },
]

const channels = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'general',
    type: 'public',
    owner: 'alice',
    members: ['john', 'alice', 'bob', 'charlie', 'diana'],
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    name: 'random',
    type: 'public',
    owner: 'alice',
    members: ['alice', 'john'],
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    name: 'dev-team',
    type: 'private',
    owner: 'john',
    members: ['john', 'alice'],
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    name: 'secret-club',
    type: 'private',
    owner: 'alice',
    members: ['alice'],
    inviteId: '20000000-0000-4000-8000-000000000001',
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    name: 'announcements',
    type: 'public',
    owner: 'bob',
    members: ['bob'],
    inviteId: '20000000-0000-4000-8000-000000000002',
  },
]

export default class DemoSeeder extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    const createdAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    const counts = await this.client.transaction(async (trx) => {
      await trx.rawQuery('SELECT pg_advisory_xact_lock(hashtext(?))', ['vpwa:demo-seeder:v1'])
      const added = { users: 0, channels: 0, memberships: 0, invites: 0 }
      const userIds = new Map<string, string>()

      for (const user of users) {
        let existing = await trx
          .query<{ id: string }>()
          .from('users')
          .where('email', user.email)
          .select('id')
          .first()

        if (!existing) {
          const inserted = await trx
            .insertQuery<{ id: string }>()
            .table('users')
            .insert({
              ...user,
              password: await hash.make('delicateflower'),
              mentionOnlyNotif: false,
              created_at: createdAt,
              updated_at: createdAt,
            })
            .returning('id')
          existing = inserted[0]
          added.users++
        }

        userIds.set(user.nick, existing.id)
      }

      const userId = (nick: string) => {
        const id = userIds.get(nick)
        if (!id) throw new Error(`Unknown demo user: ${nick}`)
        return id
      }

      for (const channel of channels) {
        const inserted = await trx
          .insertQuery()
          .table('channels')
          .insert({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            owner: userId(channel.owner),
            created_at: createdAt,
            last_activity: createdAt,
          })
          .onConflict('id')
          .ignore()
          .returning('id')
        added.channels += inserted.length

        for (const nick of channel.members) {
          const membership = await trx
            .query()
            .from('user_channels')
            .where('channel_id', channel.id)
            .where('user_id', userId(nick))
            .select('id')
            .first()

          if (!membership) {
            await trx
              .insertQuery()
              .table('user_channels')
              .insert({
                id: randomUUID(),
                channel_id: channel.id,
                user_id: userId(nick),
                banned: false,
              })
            added.memberships++
          }
        }

        if (channel.inviteId) {
          const invites = await trx
            .insertQuery()
            .table('invites')
            .insert({
              id: channel.inviteId,
              channel_id: channel.id,
              inviter_id: userId(channel.owner),
              invitee_id: userId('john'),
              created_at: now,
              status: 'pending',
            })
            .onConflict('id')
            .ignore()
            .returning('id')
          added.invites += invites.length
        }
      }

      return added
    })

    console.log(
      `Demo seed: ${counts.users} users, ${counts.channels} channels, ${counts.memberships} memberships, and ${counts.invites} invitations added.`
    )
  }
}
