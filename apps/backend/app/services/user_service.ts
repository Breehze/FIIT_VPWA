import type User from '#models/user'
import socket from '@rlanz/socket/services/main'

export type UserStatus = 'Online' | 'DND' | 'Offline'

export default class UserService {
  async updateStatus(user: User, status: UserStatus): Promise<User> {
    user.state = status
    await user.save()
    socket.to('users/online').emit('user:status', { userId: user.id, state: status })
    return user
  }

  async updateMentionOnlyNotif(user: User, notifOnly: boolean): Promise<User> {
    user.mentionOnlyNotif = notifOnly
    await user.save()
    return user
  }
}
