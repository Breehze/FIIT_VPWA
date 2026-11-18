import socket from '@rlanz/socket/services/main'
import Channel from '#models/channel'

export type ChannelSnapshot = { channels: ReturnType<Channel['serialize']>[] }

// Send snapshot updates in order for each user within this server process.
const pending = new Map<string, Promise<void>>()

export async function publishChannelSnapshot(userId: string): Promise<void> {
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

  const channels = await Channel.listForUser(userId)
  const snapshot: ChannelSnapshot = {
    channels: channels.map((channel) => channel.serialize()),
  }

  socket.to(`user/${userId}`).emit('channels:updated', snapshot)
}
