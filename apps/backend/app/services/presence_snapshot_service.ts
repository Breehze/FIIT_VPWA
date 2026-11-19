import app from '@adonisjs/core/services/app'
import socket from '@rlanz/socket/services/main'
import User from '#models/user'

export type PresenceUser = {
  id: string
  state: User['state']
}

export type PresenceSnapshot = { users: PresenceUser[] }

let pendingUpdate = Promise.resolve()

export async function publishPresenceSnapshot(): Promise<void> {
  pendingUpdate = sendAfterPrevious(pendingUpdate)
  await pendingUpdate
}

async function sendAfterPrevious(previous: Promise<void>): Promise<void> {
  try {
    await previous
  } catch {

  }

  const presence = await app.container.make('socket.presence')
  const connected = await presence.snapshot('users/online')
  const userIds = connected.users.map((user) => user.id)
  const snapshot: PresenceSnapshot = { users: [] }

  if (userIds.length > 0) {
    const users = await User.query().whereIn('id', userIds).select('id', 'state').orderBy('id')
    for (const user of users) {
      snapshot.users.push({ id: user.id, state: user.state })
    }
  }

  socket.to('users/online').emit('presence:updated', snapshot)
}
