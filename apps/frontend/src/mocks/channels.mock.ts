import type { Channel, Invite } from '@vpwa/shared';

export interface InvitedChannel {
  invite: Invite;
  channel: Channel;
}

export const DEFAULT_CHANNELS: Channel[] = [
  {
    id: 'ch-1',
    name: 'general',
    type: 'public',
    owner: '999e4567-e89b-12d3-a456-426614174999',
    lastActivity: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ch-2',
    name: 'random',
    type: 'public',
    owner: '999e4567-e89b-12d3-a456-426614174999',
    lastActivity: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ch-3',
    name: 'dev-team',
    type: 'private',
    owner: '123e4567-e89b-12d3-a456-426614174000',
    lastActivity: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_INVITES: InvitedChannel[] = [
  {
    invite: {
      id: 'inv-1',
      inviterId: '999e4567-e89b-12d3-a456-426614174999',
      inviteeId: '123e4567-e89b-12d3-a456-426614174000',
      channelId: 'ch-4',
      createdAt: new Date().toISOString(),
      status: 'pending',
    },
    channel: {
      id: 'ch-4',
      name: 'secret-club',
      type: 'private',
      owner: '999e4567-e89b-12d3-a456-426614174999',
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  },
  {
    invite: {
      id: 'inv-2',
      inviterId: '888e4567-e89b-12d3-a456-426614174888',
      inviteeId: '123e4567-e89b-12d3-a456-426614174000',
      channelId: 'ch-5',
      createdAt: new Date().toISOString(),
      status: 'pending',
    },
    channel: {
      id: 'ch-5',
      name: 'announcements',
      type: 'public',
      owner: '888e4567-e89b-12d3-a456-426614174888',
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  },
];

export const DEFAULT_CHANNEL_MEMBERS: Record<string, string[]> = {
  'ch-1': [
    '123e4567-e89b-12d3-a456-426614174000',
    '999e4567-e89b-12d3-a456-426614174999',
    '888e4567-e89b-12d3-a456-426614174888',
  ],
  'ch-2': [
    '999e4567-e89b-12d3-a456-426614174999',
    '123e4567-e89b-12d3-a456-426614174000',
  ],
  'ch-3': [
    '123e4567-e89b-12d3-a456-426614174000',
    '999e4567-e89b-12d3-a456-426614174999',
  ],
};
