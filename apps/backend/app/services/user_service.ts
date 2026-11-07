import type User from '#models/user'

export type UserStatus = 'Online' | 'DND' | 'Offline'

export default class UserService {
  async updateStatus(user: User, status: UserStatus): Promise<User> {
    user.state = status
    await user.save()
    return user
  }

  async updateMentionOnlyNotif(user: User, notifOnly: boolean): Promise<User> {
    user.mentionOnlyNotif = notifOnly
    await user.save()
    return user
  }
}
