import socket from '@rlanz/socket/services/main'
import User from '#models/user'

export type MemberSnapshot = {
  channelId: string
  members: ReturnType<User['serialize']>[]
}

const pending = new Map<string, Promise<void>>()

export async function publishMemberSnapshot(channelId: string): Promise<void> {
  const previous = pending.get(channelId)
  const pendingUpdate = sendAfterPrevious(channelId, previous)
  pending.set(channelId, pendingUpdate)

  try {
    await pendingUpdate
  } finally {
    if (pending.get(channelId) === pendingUpdate) {
      pending.delete(channelId)
    }
  }
}

async function sendAfterPrevious(channelId: string, previous?: Promise<void>): Promise<void> {
  try {
    await previous
  } catch {

  }

  const members = await User.listActiveChannelMembers(channelId)
  const snapshot: MemberSnapshot = {
    channelId,
    members: members.map((member) => member.serialize()),
  }

  socket.to(`channels/${channelId}`).emit('members:updated', snapshot)
}
