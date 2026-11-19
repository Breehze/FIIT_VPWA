import { BaseChannel } from '@rlanz/socket'
import { onMessage } from '@rlanz/socket/decorators'
import type { AuthenticatedSocket, PresenceInfo } from '@rlanz/socket/types'
import type User from '#models/user'
import { publishPresenceSnapshot, type PresenceSnapshot } from '#services/presence_snapshot_service'

export default class OnlineUsersChannel extends BaseChannel<
  User,
  { 'presence:updated': PresenceSnapshot }
> {
  static pattern = 'users/online'
  static options = { presence: true }

  getPresenceInfo(socket: AuthenticatedSocket<User>): PresenceInfo {
    return { id: socket.getUserOrFail().id }
  }

  async onMemberJoin(): Promise<void> {
    await publishPresenceSnapshot()
  }

  async onMemberLeave(): Promise<void> {
    await publishPresenceSnapshot()
  }

  @onMessage('presence:sync')
  async syncPresence(): Promise<void> {
    await publishPresenceSnapshot()
  }
}
