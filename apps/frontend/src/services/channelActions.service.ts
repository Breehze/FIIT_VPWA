import type { Channel, ChannelType, User } from '@vpwa/shared';
import {
  DEFAULT_CHANNELS,
  DEFAULT_INVITES,
  DEFAULT_CHANNEL_MEMBERS,
  MOCK_USERS,
  type InvitedChannel,
} from '@/mocks';
import { authService } from './auth.service';

export type { InvitedChannel };

export const KICK_VOTE_THRESHOLD = 3;

export interface KickVoteProgress {
  target: User;
  voteCount: number;
}


let storedChannels: Channel[] = structuredClone(DEFAULT_CHANNELS);
let storedMemberships: Record<string, string[]> = structuredClone(DEFAULT_CHANNEL_MEMBERS);
let storedInvites: InvitedChannel[] = structuredClone(DEFAULT_INVITES);
const bans = new Map<string, Set<string>>();
const kickVotes = new Map<string, Map<string, number>>();

class ChannelActionsService {
  getAllChannels(): Channel[] {
    return storedChannels;
  }

  saveChannels(channels: Channel[]): void {
    storedChannels = channels;
  }

  getChannelMemberships(): Record<string, string[]> {
    return storedMemberships;
  }

  saveChannelMemberships(memberships: Record<string, string[]>): void {
    storedMemberships = memberships;
  }

  getUserChannels(userId?: string): Channel[] {
    const currentUserId = this.resolveUserId(userId);

    const allChannels = this.getAllChannels();
    const memberships = this.getChannelMemberships();

    return allChannels.filter((c) => memberships[c.id]?.includes(currentUserId));
  }

  getChannels(userId?: string): Channel[] {
    return this.getUserChannels(userId);
  }

  getInvitedChannels(): InvitedChannel[] {
    return storedInvites;
  }

  saveInvitedChannels(invites: InvitedChannel[]): void {
    storedInvites = invites;
  }

  createChannel(name: string, type: ChannelType, ownerId: string): Channel {
    const cleanName = name.trim().replace(/^#/, '');
    const channels = this.getAllChannels();

    const newChannel: Channel = {
      id: crypto.randomUUID(),
      name: cleanName,
      type,
      owner: ownerId,
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    channels.push(newChannel);
    this.saveChannels(channels);

    const memberships = this.getChannelMemberships();
    memberships[newChannel.id] = [ownerId];
    this.saveChannelMemberships(memberships);

    return newChannel;
  }

  joinChannel(name: string, type: ChannelType = 'public', userId?: string): Channel {
    const currentUserId = this.resolveUserId(userId);
    const cleanName = name.trim().replace(/^#/, '');
    const channels = this.getAllChannels();

    const existing = channels.find((c) => c.name.trim().toLowerCase() === cleanName.toLowerCase());

    const memberships = this.getChannelMemberships();

    if (existing) {
      this.assertNotBanned(existing.id, currentUserId);
      const currentMembers = memberships[existing.id] ?? [];

      if (currentMembers.includes(currentUserId)) {
        return existing;
      }

      if (existing.type === 'private') {
        throw new Error(`#${existing.name} is private, you need an invite`);
      }

      memberships[existing.id] = [...currentMembers, currentUserId];
      this.saveChannelMemberships(memberships);

      return existing;
    }

    const newChannel: Channel = {
      id: crypto.randomUUID(),
      name: cleanName,
      type,
      owner: currentUserId,
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    channels.push(newChannel);
    this.saveChannels(channels);

    memberships[newChannel.id] = [currentUserId];
    this.saveChannelMemberships(memberships);

    return newChannel;
  }

  leaveChannel(channelId: string, userId?: string): void {
    const currentUserId = this.resolveUserId(userId);
    const channel = this.getAllChannels().find((c) => c.id === channelId);

    if (!channel) return;

    if (channel.owner === currentUserId) {
      this.removeChannel(channelId);
      return;
    }

    const memberships = this.getChannelMemberships();

    memberships[channelId] = (memberships[channelId] ?? []).filter((id) => id !== currentUserId);

    this.saveChannelMemberships(memberships);
  }

  deleteChannel(channelId: string, userId?: string): void {
    const currentUserId = this.resolveUserId(userId);
    const channel = this.getAllChannels().find((c) => c.id === channelId);

    if (!channel) return;

    if (channel.owner !== currentUserId) {
      throw new Error('Only the channel admin can close the channel');
    }

    this.removeChannel(channelId);
  }

  getKickVotes(channelId: string): KickVoteProgress[] {
    const members = this.getChannelMembers(channelId);
    return Array.from(kickVotes.get(channelId) ?? []).flatMap(([targetId, voteCount]) => {
      const target = members.find((member) => member.id === targetId);
      return target ? [{ target, voteCount }] : [];
    });
  }

  kickMember(channelId: string, nickname: string, userId?: string): void {
    const currentUserId = this.resolveUserId(userId);
    const channel = this.requireMember(channelId, currentUserId);
    if (channel.type !== 'public') {
      throw new Error('/kick is only available in public channels');
    }
    const target = this.findUser(nickname);
    if (target.id === currentUserId) throw new Error('You cannot kick yourself');
    if (target.id === channel.owner) throw new Error('You cannot kick the channel admin');
    const memberships = this.getChannelMemberships();
    if (!memberships[channelId]?.includes(target.id)) {
      throw new Error(`${target.nick} is not a member of this channel`);
    }

    const channelVotes = kickVotes.get(channelId) ?? new Map<string, number>();
    const voteCount = (channelVotes.get(target.id) ?? 0) + 1;
    channelVotes.set(target.id, voteCount);
    kickVotes.set(channelId, channelVotes);

    if (channel.owner === currentUserId || voteCount >= KICK_VOTE_THRESHOLD) {
      const channelBans = bans.get(channelId) ?? new Set<string>();
      channelBans.add(target.id);
      bans.set(channelId, channelBans);
      memberships[channelId] = (memberships[channelId] ?? []).filter((id) => id !== target.id);
      this.saveChannelMemberships(memberships);
      channelVotes.delete(target.id);
    }
  }

  revokeMember(channelId: string, nickname: string, userId?: string): void {
    const currentUserId = this.resolveUserId(userId);
    const channel = this.requireMember(channelId, currentUserId);
    if (channel.type !== 'private') {
      throw new Error('/revoke is only available in private channels');
    }
    if (channel.owner !== currentUserId) {
      throw new Error('Only the channel admin can revoke membership');
    }
    const target = this.findUser(nickname);
    if (target.id === currentUserId) {
      throw new Error('You cannot revoke your own membership; use /cancel instead');
    }
    const memberships = this.getChannelMemberships();
    const members = memberships[channelId] ?? [];
    if (!members.includes(target.id)) {
      throw new Error(`${target.nick} is not a member of this channel`);
    }
    memberships[channelId] = members.filter((id) => id !== target.id);
    this.saveChannelMemberships(memberships);
  }

  private requireMember(channelId: string, userId: string): Channel {
    const channel = this.getAllChannels().find((c) => c.id === channelId);
    if (!channel) throw new Error('Channel not found');
    if (!this.getChannelMemberships()[channelId]?.includes(userId)) {
      throw new Error('You must be a member of this channel');
    }
    return channel;
  }

  private findUser(nickname: string): User {
    const nick = nickname.trim().replace(/^@/, '');
    const user = MOCK_USERS.find((item) => item.nick === nick);
    if (!user) throw new Error(`User ${nickname} not found`);
    return user;
  }

  private assertNotBanned(channelId: string, userId: string): void {
    if (bans.get(channelId)?.has(userId)) {
      throw new Error('You are banned from this channel');
    }
  }

  private removeChannel(channelId: string): void {
    bans.delete(channelId);
    kickVotes.delete(channelId);
    const channels = this.getAllChannels().filter((c) => c.id !== channelId);
    this.saveChannels(channels);

    const memberships = this.getChannelMemberships();
    delete memberships[channelId];
    this.saveChannelMemberships(memberships);
  }

  private resolveUserId(userId?: string): string {
    return userId ?? authService.getUserFromStorage()?.id ?? '123e4567-e89b-12d3-a456-426614174000';
  }

  acceptInvite(inviteId: string, userId?: string): Channel | null {
    const currentUserId = this.resolveUserId(userId);
    const invites = this.getInvitedChannels();
    const target = invites.find((item) => item.invite.id === inviteId);

    if (!target) return null;

    const remainingInvites = invites.filter((item) => item.invite.id !== inviteId);
    this.saveInvitedChannels(remainingInvites);

    const channels = this.getAllChannels();

    if (!channels.some((c) => c.id === target.channel.id)) {
      channels.push(target.channel);
      this.saveChannels(channels);
    }

    const memberships = this.getChannelMemberships();
    const currentMembers = memberships[target.channel.id] ?? [];

    if (!currentMembers.includes(currentUserId)) {
      memberships[target.channel.id] = [...currentMembers, currentUserId];
      this.saveChannelMemberships(memberships);
    }

    return target.channel;
  }

  rejectInvite(inviteId: string): void {
    const invites = this.getInvitedChannels().filter((item) => item.invite.id !== inviteId);

    this.saveInvitedChannels(invites);
  }

  getChannelMembers(channelId: string): User[] {
    const memberships = this.getChannelMemberships();
    const userIds = memberships[channelId] ?? [];

    return MOCK_USERS.filter((user) => userIds.includes(user.id));
  }
}

export const channelActionsService = new ChannelActionsService();
