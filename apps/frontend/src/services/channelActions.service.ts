import type { Channel, ChannelType, Invite, User } from '@vpwa/shared';

export interface InvitedChannel {
  invite: Invite;
  channel: Channel;
}

const API_URL = 'http://localhost:3333';

async function channelRequest<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const error = result as {
      message?: string;
      errors?: { message?: string }[];
    } | null;

    throw Object.assign(
      new Error(
        error?.errors?.[0]?.message ?? error?.message ?? `Request failed (${response.status})`,
      ),
      { status: response.status },
    );
  }

  return result as T;
}

class ChannelActionsService {
  async fetchUserChannels(): Promise<Channel[]> {
    return channelRequest<Channel[]>('/channels');
  }

  async fetchChannelMembers(channelId: string): Promise<User[]> {
    return channelRequest<User[]>(`/channels/${encodeURIComponent(channelId)}/members`);
  }

  async leaveChannelApi(channelId: string): Promise<void> {
    await channelRequest<unknown>(`/channels/${encodeURIComponent(channelId)}/leave`, {});
  }

  async kickMemberApi(channelId: string, nick: string): Promise<void> {
    await channelRequest<unknown>(`/channels/${encodeURIComponent(channelId)}/kick`, { nick });
  }

  async revokeMemberApi(channelId: string, nick: string): Promise<void> {
    await channelRequest<unknown>(`/channels/${encodeURIComponent(channelId)}/revoke`, { nick });
  }

  async deleteChannelApi(channelId: string): Promise<void> {
    const response = await fetch(`${API_URL}/channels/${encodeURIComponent(channelId)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Failed to delete channel (${response.status})`);
  }

  async createChannelApi(name: string, type: ChannelType): Promise<Channel> {
    return channelRequest<Channel>('/channels/create', {
      name: name.trim().replace(/^#/, ''),
      type,
    });
  }

  async joinChannelApi(name: string): Promise<Channel> {
    return channelRequest<Channel>('/channels/join', {
      name: name.trim().replace(/^#/, ''),
    });
  }

  async inviteMemberApi(channelId: string, nickname: string): Promise<void> {
    await channelRequest<unknown>(`/channels/${encodeURIComponent(channelId)}/invite`, {
      nick: nickname.trim().replace(/^@/, ''),
    });
  }

  async fetchPendingInvitesApi(): Promise<InvitedChannel[]> {
    return channelRequest<InvitedChannel[]>('/invites');
  }

  async processInviteApi(inviteId: string, action: 'accept' | 'reject'): Promise<void> {
    await channelRequest<unknown>('/invites', {
      inviteId,
      action,
    });
  }
}

export const channelActionsService = new ChannelActionsService();
