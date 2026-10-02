import type { Channel, ChannelType } from '@vpwa/shared';
import { DEFAULT_CHANNELS, DEFAULT_INVITES, type InvitedChannel } from '@/mocks';

export type { InvitedChannel };

const STORAGE_KEY_CHANNELS = 'mock_channels';
const STORAGE_KEY_INVITES = 'mock_invites';

class ChannelActionsService {
  getChannels(): Channel[] {
    const raw = localStorage.getItem(STORAGE_KEY_CHANNELS);
    if (!raw) {
      this.saveChannels(DEFAULT_CHANNELS);
      return DEFAULT_CHANNELS;
    }
    return JSON.parse(raw);
  }

  saveChannels(channels: Channel[]): void {
    localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
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
    const channels = this.getChannels();
    const newChannel: Channel = {
      id: crypto.randomUUID(),
      name,
      type,
      owner: ownerId,
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    channels.push(newChannel);
    this.saveChannels(channels);
    return newChannel;
  }

  leaveChannel(channelId: string): void {
    const channels = this.getChannels().filter((c) => c.id !== channelId);
    this.saveChannels(channels);
  }

  deleteChannel(channelId: string): void {
    const channels = this.getChannels().filter((c) => c.id !== channelId);
    this.saveChannels(channels);
  }

  acceptInvite(inviteId: string): Channel | null {
    const invites = this.getInvitedChannels();
    const target = invites.find((item) => item.invite.id === inviteId);
    if (!target) return null;

    const remainingInvites = invites.filter((item) => item.invite.id !== inviteId);
    this.saveInvitedChannels(remainingInvites);

    const channels = this.getChannels();
    channels.push(target.channel);
    this.saveChannels(channels);
    return target.channel;
  }

  rejectInvite(inviteId: string): void {
    const invites = this.getInvitedChannels().filter((item) => item.invite.id !== inviteId);
    this.saveInvitedChannels(invites);
  }
}

export const channelActionsService = new ChannelActionsService();
