import type Msg from '#models/msg'
import type User from '#models/user'

export function serializeMessage(message: Msg, sender: User | null) {
  return {
    id: message.id,
    channelId: message.channelId,
    senderId: message.senderId,
    contentType: message.contentType,
    textContent: message.textContent,
    cdnLink: message.cdnLink ?? null,
    createdAt: message.createdAt.toISO()!,
    sender: sender
      ? { id: sender.id, nick: sender.nick, name: sender.name, lastName: sender.lastName }
      : null,
  }
}
