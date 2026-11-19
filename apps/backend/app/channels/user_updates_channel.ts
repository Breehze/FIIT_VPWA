import { BaseChannel, SocketResponseError } from '@rlanz/socket'
import { onMessage } from '@rlanz/socket/decorators'
import type { AuthenticatedSocket, MiddlewareContext } from '@rlanz/socket/types'
import type User from '#models/user'
import Invite from '#models/invite'
import { publishChannelSnapshot, type ChannelSnapshot } from '#services/channel_snapshot_service'
import { publishInviteSnapshot, type InviteSnapshot } from '#services/invite_snapshot_service'
import type { KickVoteSnapshot } from '#services/kick_vote_snapshot_service'

async function requireOwnChannel(ctx: MiddlewareContext<User>, next: () => Promise<void>) {
  const userId = ctx.socket.getUserOrFail().id
  if (ctx.params.userId !== userId) {
    throw new SocketResponseError('Not your user channel')
  }

  await next()
}

export default class UserUpdatesChannel extends BaseChannel<
  User,
  {
    'invites:updated': InviteSnapshot
    'channels:updated': ChannelSnapshot
    'kick-votes:updated': KickVoteSnapshot
  }
> {
  static pattern = 'user/:userId'
  static middlewares = [requireOwnChannel]

  @onMessage('channels:sync')
  async syncChannels(socket: AuthenticatedSocket<User>): Promise<void> {
    const userId = socket.getUserOrFail().id
    if (this.params.userId !== userId) {
      throw new SocketResponseError('Not your user channel')
    }

    await publishChannelSnapshot(userId)
  }

  @onMessage('invites:list')
  async list(socket: AuthenticatedSocket<User>) {
    const userId = socket.getUserOrFail().id
    if (this.params.userId !== userId) {
      throw new SocketResponseError('Not your user channel')
    }

    const invites = await Invite.listPendingForUser(userId)
    return { invites: invites.map((invite) => invite.serialize()) }
  }

  @onMessage('invites:sync')
  async syncInvites(socket: AuthenticatedSocket<User>): Promise<void> {
    const userId = socket.getUserOrFail().id
    if (this.params.userId !== userId) {
      throw new SocketResponseError('Not your user channel')
    }

    await publishInviteSnapshot(userId)
  }
}
