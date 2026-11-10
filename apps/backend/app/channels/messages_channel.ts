import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { BaseChannel, SocketResponseError } from '@rlanz/socket'
import { onMessage } from '@rlanz/socket/decorators'
import type { AuthenticatedSocket, MiddlewareContext, PresenceInfo } from '@rlanz/socket/types'
import User from '#models/user'
import UserChannel from '#models/user_channel'
import Channel from '#models/channel'
import Msg from '#models/msg'

type MessageEvent = {
  id: number
  channelId: string
  senderId: string
  contentType: 'text'
  textContent: string
  createdAt: string
}

type LiveEvents = {
  'message:created': MessageEvent
}

async function requireChannelMember(ctx: MiddlewareContext<User>, next: () => Promise<void>) {
  const channelId = ctx.params.channelId
  const userId = ctx.socket.getUserOrFail().id
  const channel = channelId ? await Channel.find(channelId) : null

  if (
    !channelId ||
    !(await UserChannel.findActiveForUser(channelId, userId)) ||
    !channel ||
    channel.isExpired()
  ) {
    throw new SocketResponseError('Not a member of this channel')
  }

  await next()
}

export default class MessagesChannel extends BaseChannel<User, LiveEvents> {
  static pattern = 'channels/:channelId'
  static options = { presence: true }

  static middlewares = [requireChannelMember]

  getPresenceInfo(socket: AuthenticatedSocket<User>): PresenceInfo {
    const user = socket.getUserOrFail()
    return { id: user.id, data: { nick: user.nick } }
  }

  private async requireActiveMember(socket: AuthenticatedSocket<User>): Promise<string> {
    const channelId = this.params.channelId
    if (
      !channelId ||
      !(await UserChannel.findActiveForUser(channelId, socket.getUserOrFail().id))
    ) {
      throw new SocketResponseError('Not a member of this channel')
    }
    return channelId
  }

  @onMessage('message:send')
  async send(socket: AuthenticatedSocket<User>, payload: { text: string }): Promise<MessageEvent> {
    const channelId = await this.requireActiveMember(socket)
    const userId = socket.getUserOrFail().id
    const text = typeof payload?.text === 'string' ? payload.text.trim() : ''

    if (!text || text.length > 4000) {
      throw new SocketResponseError('Message must be between 1 and 4000 characters')
    }

    const message = await db.transaction(async (trx) => {
      const channel = await Channel.query({ client: trx })
        .where('id', channelId)
        .forUpdate()
        .first()
      if (!channel || channel.isExpired()) {
        throw new SocketResponseError('Channel has expired')
      }

      const saved = await Msg.create(
        { channelId, senderId: userId, contentType: 'text', textContent: text },
        { client: trx }
      )
      await Channel.query({ client: trx })
        .where('id', channelId)
        .update({ lastActivity: DateTime.now() })
      return saved
    })

    const event: MessageEvent = {
      id: message.id,
      channelId,
      senderId: userId,
      contentType: 'text',
      textContent: text,
      createdAt: message.createdAt.toISO()!,
    }

    this.broadcast('message:created', event)
    return event
  }
}
