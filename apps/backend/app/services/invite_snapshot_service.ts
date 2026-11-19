import socket from '@rlanz/socket/services/main'
import Invite from '#models/invite'
import type Channel from '#models/channel'

type PendingInvite = {
  invite: ReturnType<Invite['serialize']>
  channel: ReturnType<Channel['serialize']>
}

export type InviteSnapshot = { invites: PendingInvite[] }

// Send snapshot updates in order for each user within this server process.
const pending = new Map<string, Promise<void>>()

export async function publishInviteSnapshot(userId: string): Promise<void> {
  const previous = pending.get(userId)
  const pendingUpdate = sendAfterPrevious(userId, previous)
  pending.set(userId, pendingUpdate)

  try {
    await pendingUpdate
  } finally {
    if (pending.get(userId) === pendingUpdate) {
      pending.delete(userId)
    }
  }
}

async function sendAfterPrevious(userId: string, previous?: Promise<void>): Promise<void> {
  try {
    await previous
  } catch {

  }

  const invites = await Invite.listPendingForUser(userId)
  const snapshot: InviteSnapshot = { invites: [] }

  for (const invite of invites) {
    snapshot.invites.push({
      invite: invite.serialize(),
      channel: invite.channel.serialize(),
    })
  }

  socket.to(`user/${userId}`).emit('invites:updated', snapshot)
}
