import socket from '@rlanz/socket/services/main'
import Channel from '#models/channel'
import UserChannel from '#models/user_channel'
import VoteKick from '#models/vote_kick'

export type KickVoteProgress = {
  targetId: string
  nick: string
  votes: number
  votedByMe: boolean
}

export type KickVoteSnapshot = {
  channelId: string
  votes: KickVoteProgress[]
}

const pending = new Map<string, Promise<void>>()

export function serializeKickVotes(votes: VoteKick[], userId: string): KickVoteProgress[] {
  return votes.map((vote) => ({
    targetId: vote.targetId,
    nick: vote.target.nick,
    votes: vote.voters.length,
    votedByMe: vote.voters.some((voter) => voter.userId === userId),
  }))
}

// Without a userId, send each active member their own snapshot.
export async function publishKickVoteSnapshot(channelId: string, userId?: string): Promise<void> {
  const previous = pending.get(channelId)
  const pendingUpdate = sendAfterPrevious(channelId, userId, previous)
  pending.set(channelId, pendingUpdate)

  try {
    await pendingUpdate
  } finally {
    if (pending.get(channelId) === pendingUpdate) {
      pending.delete(channelId)
    }
  }
}

async function sendAfterPrevious(
  channelId: string,
  userId: string | undefined,
  previous?: Promise<void>
): Promise<void> {
  try {
    await previous
  } catch {
    // A failed update must not block the next snapshot.
  }

  const channel = await Channel.find(channelId)
  if (!channel || channel.isExpired()) return

  const recipients = UserChannel.query().where('channelId', channelId).where('banned', false)
  if (userId) recipients.where('userId', userId)
  const members = await recipients

  let votes: VoteKick[] = []
  if (channel.type === 'public') {
    votes = await VoteKick.query().where('channelId', channelId).preload('target').preload('voters')
  }

  for (const member of members) {
    const snapshot: KickVoteSnapshot = {
      channelId,
      votes: serializeKickVotes(votes, member.userId),
    }
    socket.to(`user/${member.userId}`).emit('kick-votes:updated', snapshot)
  }
}
