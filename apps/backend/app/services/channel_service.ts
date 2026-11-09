import { Exception } from '@adonisjs/core/exceptions'
import Channel from '#models/channel'
import User from '#models/user'
import UserChannel from '#models/user_channel'
import Invite from '#models/invite'
import VoteKick from '#models/vote_kick'
import Msg from '#models/msg'

export type ChannelType = 'public' | 'private'

const KICK_VOTE_THRESHOLD = 3

export default class ChannelService {
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
        await existing.deleteWithRelations()
      } else {
        throw new Exception(`Channel #${existing.name} already exists`, { status: 409 })
      }
    }

    return Channel.createWithOwner(userId, rawName, type)
  }

  /**
   * POST /channels/join
   */
  async joinChannel(userId: string, rawName: string): Promise<Channel> {
    const channel = await Channel.findByName(rawName)

    if (!channel) {
      throw new Exception('Channel not found', { status: 404 })
    }

    if (channel.isExpired()) {
      await channel.deleteWithRelations()
      throw new Exception('Channel not found', { status: 404 })
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
    return channel
  }

  /**
   * POST /channels/:channelId/leave
   */
  async leaveChannel(userId: string, channelId: string): Promise<void> {
    const channel = await Channel.findOrFail(channelId)
    const membership = await UserChannel.requireActiveForUser(channel.id, userId)

    if (channel.owner === userId) {
      await channel.deleteWithRelations()
      return
    }

    await membership.delete()
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

    return Invite.findOrCreatePending(channel.id, userId, targetUser.id)
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
      return { banned: true, votes: KICK_VOTE_THRESHOLD }
    }

    const votes = await VoteKick.addVoteAndCount(channel.id, targetUser.id, userId)
    if (votes >= KICK_VOTE_THRESHOLD) {
      await targetMembership.markBanned()
      await VoteKick.clearForTarget(channel.id, targetUser.id)
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

    await channel.deleteWithRelations()
  }
}
