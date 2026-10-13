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

const STORAGE_KEY_CHANNELS = 'mock_channels';
const STORAGE_KEY_MEMBERS = 'mock_channel_members';
const STORAGE_KEY_INVITES = 'mock_invites';

class ChannelActionsService {
  getAllChannels(): Channel[] {
    const raw = localStorage.getItem(STORAGE_KEY_CHANNELS);
    if (!raw) {
      this.saveChannels(DEFAULT_CHANNELS);
      return DEFAULT_CHANNELS;
    }
    let channels: Channel[] = JSON.parse(raw);
    const hasGeneral = channels.some((c) => c.id === 'ch-1');
    if (!hasGeneral) {
      channels = channels.filter((c) => c.name.trim().toLowerCase() !== 'general');
      const defaultGeneral = DEFAULT_CHANNELS.find((c) => c.id === 'ch-1');
      if (defaultGeneral) {
        channels.unshift(defaultGeneral);
      }
      this.saveChannels(channels);
    }
    return channels;
  }

  saveChannels(channels: Channel[]): void {
    localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
  }

  getChannelMemberships(): Record<string, string[]> {
    const raw = localStorage.getItem(STORAGE_KEY_MEMBERS);
    if (!raw) {
      this.saveChannelMemberships(DEFAULT_CHANNEL_MEMBERS);
      return DEFAULT_CHANNEL_MEMBERS;
    }
    const memberships: Record<string, string[]> = JSON.parse(raw);
    for (const [chId, userIds] of Object.entries(DEFAULT_CHANNEL_MEMBERS)) {
      if (!memberships[chId]) {
        memberships[chId] = [...userIds];
      } else {
        for (const uid of userIds) {
          if (!memberships[chId].includes(uid)) {
            memberships[chId].push(uid);
          }
        }
      }
    }
    return memberships;
  }

  saveChannelMemberships(memberships: Record<string, string[]>): void {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(memberships));
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
    const raw = localStorage.getItem(STORAGE_KEY_INVITES);
    if (!raw) {
      this.saveInvitedChannels(DEFAULT_INVITES);
      return DEFAULT_INVITES;
    }
    return JSON.parse(raw);
  }

  saveInvitedChannels(invites: InvitedChannel[]): void {
    localStorage.setItem(STORAGE_KEY_INVITES, JSON.stringify(invites));
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
    const existing = channels.find(
      (c) => c.name.trim().toLowerCase() === cleanName.toLowerCase(),
    );

    const memberships = this.getChannelMemberships();

    if (existing) {
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

  private removeChannel(channelId: string): void {
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
