import { ref, computed, watch } from 'vue';
import type { Channel, ChannelType, User } from '@vpwa/shared';
import { channelActionsService, type InvitedChannel } from '@/services/channelActions.service';
import { useAuth } from '@/composables/useAuth';
import { useNotifications } from '@/composables/useNotifications';

const channels = ref<Channel[]>(channelActionsService.getUserChannels());
const invitedChannels = ref<InvitedChannel[]>(channelActionsService.getInvitedChannels());
const activeChannelId = ref<string | null>(channels.value[0]?.id || null);

export function useChannels() {
  const { currentUser } = useAuth();
  const { removeChannelNotifications } = useNotifications();

  watch(() => currentUser.value?.id, refreshChannels, { immediate: true });

  const activeChannel = computed(() => {
    return channels.value.find((c) => c.id === activeChannelId.value) || null;
  });

  const activeChannelMembers = computed<User[]>(() => {
    const channel = channels.value.find((c) => c.id === activeChannelId.value);
    if (!channel) return [];
    return channelActionsService.getChannelMembers(channel.id);
  });

  const activeKickVotes = computed(() => {
    const channel = channels.value.find((c) => c.id === activeChannelId.value);
    if (!channel) return [];
    return channelActionsService.getKickVotes(channel.id);
  });

  function selectChannel(channelId: string) {
    activeChannelId.value = channelId;
  }

  function refreshChannels() {
    channels.value = channelActionsService.getUserChannels(currentUser.value?.id);
    if (activeChannelId.value && !channels.value.some((c) => c.id === activeChannelId.value)) {
      removeChannelNotifications(activeChannelId.value);
      activeChannelId.value = channels.value[0]?.id ?? null;
    }
  }

  function createChannel(name: string, type: ChannelType) {
    if (!currentUser.value) return;
    const newChannel = channelActionsService.createChannel(name, type, currentUser.value.id);
    refreshChannels();
    activeChannelId.value = newChannel.id;
    return newChannel;
  }

  function joinChannel(name: string, type: ChannelType = 'public') {
    const joined = channelActionsService.joinChannel(name, type, currentUser.value?.id);
    refreshChannels();
    selectChannel(joined.id);
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
    refreshChannels();
  }

  function afterChannelRemoved(channelId: string) {
    refreshChannels();
    removeChannelNotifications(channelId);
  }

  function acceptInvite(inviteId: string) {
    const joinedChannel = channelActionsService.acceptInvite(inviteId, currentUser.value?.id);
    invitedChannels.value = channelActionsService.getInvitedChannels();
    refreshChannels();
    if (joinedChannel) {
      activeChannelId.value = joinedChannel.id;
    }
  }

  function rejectInvite(inviteId: string) {
    channelActionsService.rejectInvite(inviteId);
    invitedChannels.value = channelActionsService.getInvitedChannels();
  }

  return {
    channels,
    invitedChannels,
    activeChannelId,
    activeChannel,
    activeChannelMembers,
    activeKickVotes,
    selectChannel,
    createChannel,
    joinChannel,
    leaveChannel,
    deleteChannel,
    kickMember,
    acceptInvite,
    rejectInvite,
  };
}
