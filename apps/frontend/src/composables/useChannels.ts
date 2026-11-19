import { ref, computed } from 'vue';
import type { Channel, ChannelType, User } from '@vpwa/shared';
import {
  channelActionsService,
  type InvitedChannel,
  type KickVoteProgress,
} from '@/services/channelActions.service';
import { useAuth } from '@/composables/useAuth';
import { useNotifications } from '@/composables/useNotifications';

const channels = ref<Channel[]>([]);
const loadedChannelsForUserId = ref<string | null>(null);
const invitedChannels = ref<InvitedChannel[]>([]);
const activeChannelId = ref<string | null>(null);
const membersByChannel = ref<Record<string, User[]>>({});
const onlineUserIds = ref(new Set<string>());
const statusOverrides = ref<Record<string, User['state']>>({});
const kickVotesByChannel = ref<Record<string, KickVoteProgress[]>>({});
const voteLoadVersions = new Map<string, number>();
let pendingSelectionId: string | null = null;

async function refreshKickVotes(channelId: string): Promise<void> {
  const version = (voteLoadVersions.get(channelId) ?? 0) + 1;
  voteLoadVersions.set(channelId, version);
  try {
    const votes = await channelActionsService.fetchKickVotes(channelId);
    if (
      voteLoadVersions.get(channelId) === version &&
      channels.value.some((c) => c.id === channelId)
    ) {
      kickVotesByChannel.value = { ...kickVotesByChannel.value, [channelId]: votes };
    }
  } catch (error) {
    console.error('Failed to load kick votes:', error);
  }
}

export function useChannels() {
  const { currentUser } = useAuth();
  const { removeChannelNotifications } = useNotifications();

  const channelsLoaded = computed(
    () => !!currentUser.value && loadedChannelsForUserId.value === currentUser.value.id,
  );

  const activeChannel = computed(() => {
    return channels.value.find((c) => c.id === activeChannelId.value) || null;
  });

  const activeKickVotes = computed(
    () => kickVotesByChannel.value[activeChannelId.value ?? ''] ?? [],
  );

  const activeChannelMembers = computed<User[]>(() => {
    const members = membersByChannel.value[activeChannelId.value ?? ''] ?? [];

    return members.map((member) => {
      const preference =
        member.id === currentUser.value?.id
          ? currentUser.value.state
          : (statusOverrides.value[member.id] ?? member.state);
      return {
        ...member,
        state:
          !onlineUserIds.value.has(member.id) || preference === 'Offline'
            ? ('Offline' as const)
            : preference,
      };
    });
  });

  function setOnlineUsers(ids: string[]): void {
    onlineUserIds.value = new Set(ids);
  }

  function setMemberStatus(userId: string, state: User['state']): void {
    statusOverrides.value = { ...statusOverrides.value, [userId]: state };
  }

  function selectChannel(channelId: string) {
    if (channels.value.some((channel) => channel.id === channelId)) {
      activeChannelId.value = channelId;
      pendingSelectionId = null;
    } else {
      // The HTTP action can finish before its socket snapshot arrives.
      pendingSelectionId = channelId;
    }
  }

  async function refreshMembers(channelId: string): Promise<void> {
    try {
      const members = await channelActionsService.fetchChannelMembers(channelId);
      if (channels.value.some((channel) => channel.id === channelId)) {
        membersByChannel.value = { ...membersByChannel.value, [channelId]: members };
      }
    } catch (error) {
      console.error('Failed to load channel members:', error);
    }
  }

  function setChannels(updatedChannels: Channel[]): void {
    for (const channel of channels.value) {
      if (!updatedChannels.some((updated) => updated.id === channel.id)) {
        removeChannelNotifications(channel.id);
      }
    }
    channels.value = updatedChannels;
    loadedChannelsForUserId.value = currentUser.value?.id ?? null;
    const activeIds = new Set(updatedChannels.map((channel) => channel.id));
    membersByChannel.value = Object.fromEntries(
      Object.entries(membersByChannel.value).filter(([id]) => activeIds.has(id)),
    );
    kickVotesByChannel.value = Object.fromEntries(
      Object.entries(kickVotesByChannel.value).filter(([id]) => activeIds.has(id)),
    );

    if (pendingSelectionId && activeIds.has(pendingSelectionId)) {
      activeChannelId.value = pendingSelectionId;
      pendingSelectionId = null;
    } else if (!activeChannelId.value || !activeIds.has(activeChannelId.value)) {
      activeChannelId.value = channels.value[0]?.id ?? null;
    }
  }

  function resetChannels(): void {
    for (const channel of channels.value) {
      removeChannelNotifications(channel.id);
    }
    channels.value = [];
    loadedChannelsForUserId.value = null;
    invitedChannels.value = [];
    activeChannelId.value = null;
    pendingSelectionId = null;
    membersByChannel.value = {};
    onlineUserIds.value = new Set();
    statusOverrides.value = {};
    kickVotesByChannel.value = {};
    voteLoadVersions.clear();
  }

  async function createChannel(name: string, type: ChannelType): Promise<Channel> {
    if (!currentUser.value) {
      throw new Error('You must be logged in to create a channel');
    }

    const newChannel = await channelActionsService.createChannelApi(name, type);

    selectChannel(newChannel.id);

    return newChannel;
  }

  async function joinChannel(name: string, type: ChannelType = 'public'): Promise<Channel> {
    if (!currentUser.value) {
      throw new Error('You must be logged in to join a channel');
    }

    let joined: Channel;
    try {
      joined = await channelActionsService.joinChannelApi(name);
    } catch (error) {
      if (!(error instanceof Error && 'status' in error && error.status === 404)) {
        throw error;
      }
      joined = await channelActionsService.createChannelApi(name, type);
    }

    selectChannel(joined.id);

    return joined;
  }

  async function leaveChannel(channelId: string) {
    await channelActionsService.leaveChannelApi(channelId);
  }

  async function deleteChannel(channelId: string) {
    await channelActionsService.deleteChannelApi(channelId);
  }

  async function kickMember(channelId: string, nickname: string) {
    const result = await channelActionsService.kickMemberApi(channelId, nickname);
    await refreshKickVotes(channelId);
    await refreshMembers(channelId);
    return result;
  }

  async function revokeMember(channelId: string, nickname: string) {
    await channelActionsService.revokeMemberApi(channelId, nickname);
    await refreshMembers(channelId);
  }

  async function inviteMember(channelId: string, nickname: string): Promise<void> {
    if (!currentUser.value) {
      throw new Error('You must be logged in to invite users');
    }

    await channelActionsService.inviteMemberApi(channelId, nickname);
  }

  async function acceptInvite(inviteId: string): Promise<void> {
    if (!currentUser.value) {
      throw new Error('You must be logged in to accept an invitation');
    }

    const pendingInvite = invitedChannels.value.find((item) => item.invite.id === inviteId);

    await channelActionsService.processInviteApi(inviteId, 'accept');

    if (pendingInvite) {
      selectChannel(pendingInvite.channel.id);
    }
  }

  async function rejectInvite(inviteId: string): Promise<void> {
    if (!currentUser.value) {
      throw new Error('You must be logged in to reject an invitation');
    }

    await channelActionsService.processInviteApi(inviteId, 'reject');
  }

  return {
    channels,
    channelsLoaded,
    invitedChannels,
    setInvites: (invites: InvitedChannel[]) => {
      invitedChannels.value = invites;
    },
    activeChannelId,
    activeChannel,
    activeChannelMembers,
    activeKickVotes,
    refreshKickVotes,
    membersByChannel,
    setOnlineUsers,
    setMemberStatus,
    selectChannel,
    setChannels,
    resetChannels,
    refreshMembers,
    createChannel,
    joinChannel,
    leaveChannel,
    deleteChannel,
    kickMember,
    revokeMember,
    acceptInvite,
    rejectInvite,
    inviteMember,
  };
}
