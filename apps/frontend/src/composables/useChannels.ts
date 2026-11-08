import { ref, computed, watch } from 'vue';
import type { Channel, ChannelType, User } from '@vpwa/shared';
import { channelActionsService, type InvitedChannel } from '@/services/channelActions.service';
import { useAuth } from '@/composables/useAuth';
import { useNotifications } from '@/composables/useNotifications';

const channels = ref<Channel[]>([]);
const invitedChannels = ref<InvitedChannel[]>([]);
const activeChannelId = ref<string | null>(null);

export function useChannels() {
  const { currentUser } = useAuth();
  const { removeChannelNotifications } = useNotifications();

  watch(
    () => currentUser.value?.id,
    () => {
      void refreshChannels().catch((error) => {
        console.error('Failed to load channels:', error);
      });

      void refreshInvites().catch((error) => {
        console.error('Failed to load invitations:', error);
      });
    },
    { immediate: true },
  );

  const activeChannel = computed(() => {
    return channels.value.find((c) => c.id === activeChannelId.value) || null;
  });

  const activeChannelMembers = computed<User[]>(() => {
    if (!activeChannelId.value) return [];

    const members = channelActionsService.getChannelMembers(activeChannelId.value);

    return members.map((member) => {
      if (member.id === currentUser.value?.id) {
        return {
          ...member,
          state: currentUser.value.state,
        };
      }

      return member;
    });
  });

  const activeKickVotes = computed(() => {
    const channel = channels.value.find((c) => c.id === activeChannelId.value);
    if (!channel) return [];
    return channelActionsService.getKickVotes(channel.id);
  });

  function selectChannel(channelId: string) {
    activeChannelId.value = channelId;
  }

  async function refreshChannels(): Promise<void> {
    const userId = currentUser.value?.id;

    if (!userId) {
      channels.value = [];
      activeChannelId.value = null;
      return;
    }

    const updatedChannels = await channelActionsService.fetchUserChannels();

    if (currentUser.value?.id !== userId) {
      return;
    }

    channels.value = updatedChannels;

    if (!channels.value.some((c) => c.id === activeChannelId.value)) {
      if (activeChannelId.value) {
        removeChannelNotifications(activeChannelId.value);
      }

      activeChannelId.value = channels.value[0]?.id ?? null;
    }
  }

  async function refreshInvites(): Promise<void> {
    const userId = currentUser.value?.id;

    if (!userId) {
      invitedChannels.value = [];
      return;
    }

    const invites = await channelActionsService.fetchPendingInvitesApi();

    if (currentUser.value?.id !== userId) {
      return;
    }

    invitedChannels.value = invites;
  }

  function refreshChannelsSafely(): void {
    void refreshChannels().catch((error) => {
      console.error('Failed to refresh channels:', error);
    });
  }

  async function createChannel(name: string, type: ChannelType): Promise<Channel> {
    if (!currentUser.value) {
      throw new Error('You must be logged in to create a channel');
    }

    const newChannel = await channelActionsService.createChannelApi(name, type);

    await refreshChannels();
    activeChannelId.value = newChannel.id;

    return newChannel;
  }

  async function joinChannel(name: string, type: ChannelType = 'public'): Promise<Channel> {
    if (!currentUser.value) {
      throw new Error('You must be logged in to join a channel');
    }

    const joined = await channelActionsService.joinChannelApi(name, type);

    await refreshChannels();
    activeChannelId.value = joined.id;

    return joined;
  }

  function leaveChannel(channelId: string) {
    channelActionsService.leaveChannel(channelId, currentUser.value?.id);
    afterChannelRemoved(channelId);
  }

  function deleteChannel(channelId: string) {
    channelActionsService.deleteChannel(channelId, currentUser.value?.id);
    afterChannelRemoved(channelId);
  }

  function kickMember(channelId: string, nickname: string) {
    channelActionsService.kickMember(channelId, nickname, currentUser.value?.id);
    refreshChannelsSafely();
  }

  function revokeMember(channelId: string, nickname: string) {
    channelActionsService.revokeMember(channelId, nickname, currentUser.value?.id);
    refreshChannelsSafely();
  }

  function afterChannelRemoved(channelId: string) {
    refreshChannelsSafely();
    removeChannelNotifications(channelId);
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

    await refreshChannels();
    await refreshInvites();

    if (
      pendingInvite &&
      channels.value.some((channel) => channel.id === pendingInvite.channel.id)
    ) {
      activeChannelId.value = pendingInvite.channel.id;
    }
  }

  async function rejectInvite(inviteId: string): Promise<void> {
    if (!currentUser.value) {
      throw new Error('You must be logged in to reject an invitation');
    }

    await channelActionsService.processInviteApi(inviteId, 'reject');

    await refreshInvites();
  }

  return {
    channels,
    invitedChannels,
    activeChannelId,
    activeChannel,
    activeChannelMembers,
    activeKickVotes,
    selectChannel,
    refreshChannels,
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
