import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import type User from '#models/user'
import Invite from '#models/invite'
import UserChannel from '#models/user_channel'

export default class InviteService {
  async listPending(user: User): Promise<Invite[]> {
    return Invite.listPendingForUser(user.id)
  }

  async process(userId: string, inviteId: string, action: 'accept' | 'reject'): Promise<Invite> {
    return db.transaction(async (trx) => {
      const invite = await Invite.findPendingForInvitee(inviteId, userId, trx)
      if (!invite) {
        throw new Exception('Pending invite not found', { status: 404 })
      }

      if (action === 'accept') {
        const membership = await UserChannel.findForUser(invite.channelId, userId, trx)
        if (membership?.banned) {
          throw new Exception('You are banned from this channel', { status: 403 })
        }
        if (membership) {
          throw new Exception('You are already a member of this channel', { status: 409 })
        }

        await UserChannel.addMember(invite.channelId, userId, trx)
      }

      await invite.markStatus(action === 'accept' ? 'accepted' : 'rejected', trx)
      return invite
    })
  }
}
