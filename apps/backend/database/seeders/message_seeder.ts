import { randomUUID } from 'node:crypto'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

const MESSAGES_PER_CHANNEL = 500
const HISTORY_DAYS = 30

const conversations = [
  [
    'Has anyone tried the latest channel changes?',
    'Yes! Joining a channel and loading its history worked for me.',
    'Nice. I will check private channels and invitations next.',
    'Please also try leaving and joining again with a second account.',
    'Done, the member list looks correct after reconnecting.',
  ],
  [
    'Quick update: I am working on message pagination today.',
    'Can you check that scrolling up keeps the current message in view?',
    'Good point. I will test that with a longer conversation and several pages of history.',
    'I tried it on a narrow screen too. Long messages should wrap without pushing the layout sideways.',
    'Thanks! I have added that to the review notes.',
  ],
  [
    'What should we cover in the next project demo?',
    'Start with login, then create a channel and invite another user.',
    'After that we can show messages arriving in two browser windows.',
    'Let us include mentions, notification preferences, and the typing indicator.\n\nWe should also demonstrate loading older messages after reconnecting.',
    'Sounds good. I will prepare the walkthrough.',
  ],
  [
    'I pushed a small layout update for review.',
    'The spacing looks better. Could we check the empty-channel state as well?',
    'Sure, I will add a short welcome message and make the input easier to find.',
    'Tested on desktop and mobile. Everything is readable now.',
    'Great, thanks for taking a look!',
  ],
]

type Channel = { id: string; name: string; created_at: Date | string }
type Member = { id: string; nick: string }
type InsertedMessage = { id: number; text_content: string }

export default class MessageSeeder extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    const now = Date.now()
    const historyStart = now - HISTORY_DAYS * 24 * 60 * 60 * 1000

    const summary = await this.client.transaction(async (trx) => {
      const channels = await trx
        .query<Channel>()
        .from('channels')
        .select('id', 'name', 'created_at')
        .orderBy('id')

      let insertedCount = 0
      let skippedCount = 0

      for (const channel of channels) {
        const members = await trx
          .query<Member>()
          .from('user_channels as membership')
          .join('users', 'users.id', 'membership.user_id')
          .where('membership.channel_id', channel.id)
          .where('membership.banned', false)
          .distinct('users.id', 'users.nick')
          .orderBy('users.id')

        const start = Math.max(historyStart, new Date(channel.created_at).getTime())
        if (members.length === 0 || !Number.isFinite(start) || start > now) {
          skippedCount++
          continue
        }

        const messages = []
        const mentionedUsers = new Map<string, string>()

        for (let index = 0; index < MESSAGES_PER_CHANNEL; index++) {
          const senderIndex = index % members.length
          const sender = members[senderIndex]
          const conversation = conversations[Math.floor(index / 5) % conversations.length]
          let text = conversation[index % conversation.length]

          if (members.length > 1 && index % 10 === 0) {
            const mentioned = members[(senderIndex + 1) % members.length]
            text = `@${mentioned.nick} ${text}`
            mentionedUsers.set(text, mentioned.id)
          }

          messages.push({
            channel_id: channel.id,
            sender_id: sender.id,
            content_type: 'text',
            text_content: text,
            cdn_link: null,
            created_at: new Date(
              start + ((now - start) * index) / (MESSAGES_PER_CHANNEL - 1)
            ).toISOString(),
          })
        }

        const inserted = await trx
          .insertQuery<InsertedMessage>()
          .table('msgs')
          .returning(['id', 'text_content'])
          .multiInsert(messages)

        const mentions = inserted.flatMap((message) => {
          const mentionedId = mentionedUsers.get(message.text_content)
          return mentionedId
            ? [{ id: randomUUID(), msg_id: message.id, mentioned_id: mentionedId }]
            : []
        })

        if (mentions.length > 0) {
          await trx.insertQuery().table('msg_mentions').multiInsert(mentions)
        }

        const latest = await trx
          .query<{ created_at: Date | string }>()
          .from('msgs')
          .where('channel_id', channel.id)
          .orderBy('created_at', 'desc')
          .select('created_at')
          .firstOrFail()

        await trx
          .query()
          .from('channels')
          .where('id', channel.id)
          .where('last_activity', '<', latest.created_at)
          .update({ last_activity: latest.created_at })

        insertedCount += inserted.length
      }

      return { channels: channels.length, insertedCount, skippedCount }
    })

    console.log(
      `Message seed: ${summary.insertedCount} messages added across ${summary.channels} channels; ${summary.skippedCount} channels skipped (no eligible members or invalid/future creation date).`
    )
  }
}
