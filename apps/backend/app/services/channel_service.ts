import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import socket from '@rlanz/socket/services/main'
import Channel from '#models/channel'
import User from '#models/user'
import UserChannel from '#models/user_channel'
import Invite from '#models/invite'
import VoteKick from '#models/vote_kick'
import Msg from '#models/msg'

export type ChannelType = 'public' | 'private'

const KICK_VOTE_THRESHOLD = 3

function notifyChannelChange(userId: string, channelId: string) {
  socket.to(`user/${userId}`).emit('channels:changed', { channelId })
}

async function disconnectSubscribers(channelId: string, userId?: string) {
  const presence = await app.container.make('socket.presence')
  const channel = `channels/${channelId}`

  for (const raw of presence.getLocalSockets(channel)) {
    if (!userId || presence.getLocalUser(channel, raw.id)?.id === userId) {
      socket.getSocket(raw.id)?.disconnect()
    }
  }
}

export default class ChannelService {
  private async deleteAndNotify(channel: Channel) {
    const members = await UserChannel.query().where('channelId', channel.id).where('banned', false)
    await channel.deleteWithRelations()
    for (const member of members) notifyChannelChange(member.userId, channel.id)
    await disconnectSubscribers(channel.id)
  }

  private async removeIfExpired(channelId: string, cutoff: DateTime): Promise<boolean> {
    const memberIds = await db.transaction(async (trx) => {
      const channel = await Channel.query({ client: trx })
        .where('id', channelId)
        .forUpdate()
        .first()

      // A different worker may have removed it, or a new message may have reset its activity.
      if (!channel || channel.lastActivity >= cutoff) return null

      const members = await UserChannel.query({ client: trx })
        .where('channelId', channel.id)
        .where('banned', false)

      await channel.deleteWithRelations(trx)
      return members.map((member) => member.userId)
    })

    if (!memberIds) return false
    for (const userId of memberIds) notifyChannelChange(userId, channelId)
    await disconnectSubscribers(channelId)
    return true
  }

  /** Remove channels with no new messages for more than 30 days. Safe to run from multiple servers. */
  async pruneExpiredChannels(now = DateTime.now()): Promise<number> {
    const cutoff = now.minus({ days: 30 })
    let lastId: string | undefined
    let removed = 0

    while (true) {
      const candidates = await Channel.query()
        .where('lastActivity', '<', cutoff.toJSDate())
        .if(!!lastId, (query) => query.where('id', '>', lastId!))
        .orderBy('id')
        .limit(100)

      if (candidates.length === 0) break

      for (const candidate of candidates) {
        lastId = candidate.id
        if (await this.removeIfExpired(candidate.id, cutoff)) removed++
      }

      if (candidates.length < 100) break
    }

    return removed
  }

  /**
   * GET /channels
   */
  async listUserChannels(userId: string): Promise<Channel[]> {
    return Channel.listForUser(userId)
  }

  /**
   * GET /channels/:channelId/members
   */
  async getChannelMembers(userId: string, channelId: string): Promise<User[]> {
    const channel = await Channel.findOrFail(channelId)
    await UserChannel.requireActiveForUser(channel.id, userId)

    return User.listActiveChannelMembers(channel.id)
  }

  /**
   * GET /channels/:channelId/msgs?beforeId=...&limit=...
   */
  async getChannelMessages(
    userId: string,
    channelId: string,
    beforeId?: number,
    limit = 20
  ): Promise<Msg[]> {
    const channel = await Channel.findOrFail(channelId)
    await UserChannel.requireActiveForUser(channel.id, userId)

    return Msg.listForChannel(channel.id, beforeId, limit)
  }

  /**
   * POST /channels/create
   */
  async createChannel(userId: string, rawName: string, type: ChannelType): Promise<Channel> {
    const existing = await Channel.findByName(rawName)

    if (existing) {
      if (existing.isExpired()) {
        await this.removeIfExpired(existing.id, DateTime.now().minus({ days: 30 }))
        // Another request may have created or refreshed this channel in the meantime.
        const current = await Channel.findByName(rawName)
        if (current) {
          throw new Exception(`Channel #${current.name} already exists`, { status: 409 })
        }
      } else {
        throw new Exception(`Channel #${existing.name} already exists`, { status: 409 })
      }
    }

    const channel = await Channel.createWithOwner(userId, rawName, type)
    notifyChannelChange(userId, channel.id)
    return channel
  }

  /**
   * POST /channels/join
   */
  async joinChannel(userId: string, rawName: string): Promise<Channel> {
    let channel = await Channel.findByName(rawName)

    if (!channel) {
      throw new Exception('Channel not found', { status: 404 })
    }

    if (channel.isExpired()) {
      await this.removeIfExpired(channel.id, DateTime.now().minus({ days: 30 }))
      channel = await Channel.findByName(rawName)
      if (!channel || channel.isExpired()) {
        throw new Exception('Channel not found', { status: 404 })
      }
    }

    const membership = await UserChannel.findForUser(channel.id, userId)
    if (membership) {
      if (membership.banned) {
        throw new Exception('You are banned from this channel', { status: 403 })
      }
      return channel
    }

    if (channel.type === 'private') {
      throw new Exception('Cannot join a private channel without an invite', { status: 403 })
    }

    await UserChannel.addMember(channel.id, userId)
    notifyChannelChange(userId, channel.id)
    return channel
  }

  /**
   * POST /channels/:channelId/leave
   */
  async leaveChannel(userId: string, channelId: string): Promise<void> {
    const channel = await Channel.findOrFail(channelId)
    const membership = await UserChannel.requireActiveForUser(channel.id, userId)

    if (channel.owner === userId) {
      await this.deleteAndNotify(channel)
      return
    }

    await membership.delete()
    notifyChannelChange(userId, channel.id)
    await disconnectSubscribers(channel.id, userId)
  }

  /**
   * POST /channels/:channelId/revoke
   */
  async revokeMember(userId: string, channelId: string, rawNick: string): Promise<void> {
    const channel = await Channel.findOrFail(channelId)
    await UserChannel.requireActiveForUser(channel.id, userId)

    if (channel.type !== 'private') {
      throw new Exception('Revoke is only available in private channels', { status: 400 })
    }

    if (channel.owner !== userId) {
      throw new Exception('Only the channel owner can revoke membership', { status: 403 })
    }

    const targetUser = await User.findByNickOrFail(rawNick)
    if (targetUser.id === userId) {
      throw new Exception('Cannot revoke your own membership', { status: 400 })
    }

    const targetMembership = await UserChannel.requireActiveForUser(channel.id, targetUser.id, 404)
    await targetMembership.delete()
    notifyChannelChange(targetUser.id, channel.id)
    await disconnectSubscribers(channel.id, targetUser.id)
  }

  /**
   * POST /channels/:channelId/invite
   */
  async inviteMember(userId: string, channelId: string, rawNick: string): Promise<Invite> {
    const channel = await Channel.findOrFail(channelId)
    await UserChannel.requireActiveForUser(channel.id, userId)

    if (channel.type === 'private' && channel.owner !== userId) {
      throw new Exception('Only the channel owner can invite users to a private channel', {
        status: 403,
      })
    }

    const targetUser = await User.findByNickOrFail(rawNick)
    const targetMembership = await UserChannel.findForUser(channel.id, targetUser.id)

    if (targetMembership) {
      if (!targetMembership.banned) {
        throw new Exception('User is already a member of this channel', { status: 409 })
      }

      if (channel.owner !== userId) {
        throw new Exception('Only the channel owner can unban a kicked user', { status: 403 })
      }

      await targetMembership.delete()
      await VoteKick.clearForTarget(channel.id, targetUser.id)
    }

    const invite = await Invite.findOrCreatePending(channel.id, userId, targetUser.id)
    socket.to(`user/${invite.inviteeId}`).emit('invite:created', invite.serialize())
    return invite
  }

  /**
   * POST /channels/:channelId/kick
   */
  async kickMember(
    userId: string,
    channelId: string,
    rawNick: string
  ): Promise<{ banned: boolean; votes: number }> {
    const channel = await Channel.findOrFail(channelId)
    await UserChannel.requireActiveForUser(channel.id, userId)

    if (channel.type !== 'public') {
      throw new Exception('Kick is only available in public channels', { status: 400 })
    }

    const targetUser = await User.findByNickOrFail(rawNick)

    if (targetUser.id === userId) {
      throw new Exception('You cannot kick yourself', { status: 400 })
    }

    if (targetUser.id === channel.owner) {
      throw new Exception('You cannot kick the channel owner', { status: 403 })
    }

    const targetMembership = await UserChannel.requireActiveForUser(channel.id, targetUser.id, 404)

    if (channel.owner === userId) {
      await targetMembership.markBanned()
      await VoteKick.clearForTarget(channel.id, targetUser.id)
      notifyChannelChange(targetUser.id, channel.id)
      await disconnectSubscribers(channel.id, targetUser.id)
      return { banned: true, votes: KICK_VOTE_THRESHOLD }
    }

    const votes = await VoteKick.addVoteAndCount(channel.id, targetUser.id, userId)
    if (votes >= KICK_VOTE_THRESHOLD) {
      await targetMembership.markBanned()
      await VoteKick.clearForTarget(channel.id, targetUser.id)
      notifyChannelChange(targetUser.id, channel.id)
      await disconnectSubscribers(channel.id, targetUser.id)
      return { banned: true, votes }
    }

    return { banned: false, votes }
  }

  /**
   * DELETE /channels/:channelId
   */
  async deleteChannel(userId: string, channelId: string): Promise<void> {
    const channel = await Channel.findOrFail(channelId)

    if (channel.owner !== userId) {
      throw new Exception('Only the channel owner can delete this channel', { status: 403 })
    }

    await this.deleteAndNotify(channel)
  }
}
