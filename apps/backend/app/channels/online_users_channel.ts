import { BaseChannel } from '@rlanz/socket'
import type { AuthenticatedSocket, PresenceInfo } from '@rlanz/socket/types'
import type User from '#models/user'
import type { UserStatus } from '#services/user_service'

export default class OnlineUsersChannel extends BaseChannel<
  User,
  { 'user:status': { userId: string; state: UserStatus } }
> {
  static pattern = 'users/online'
  static options = { presence: true }

  getPresenceInfo(socket: AuthenticatedSocket<User>): PresenceInfo {
    return { id: socket.getUserOrFail().id }
  }
}
