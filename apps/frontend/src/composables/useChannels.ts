import { ref, computed } from 'vue';
import type { Channel, ChannelType, User } from '@vpwa/shared';
import { channelActionsService, type InvitedChannel } from '@/services/channelActions.service';
import { useAuth } from '@/composables/useAuth';

const channels = ref<Channel[]>(channelActionsService.getChannels());
const invitedChannels = ref<InvitedChannel[]>(channelActionsService.getInvitedChannels());
const activeChannelId = ref<string | null>(channels.value[0]?.id || null);

export function useChannels() {
  const { currentUser } = useAuth();

  const activeChannel = computed(() => {
    return channels.value.find((c) => c.id === activeChannelId.value) || null;
  });

  const activeChannelMembers = computed<User[]>(() => {
    if (!activeChannelId.value) return [];
    return channelActionsService.getChannelMembers(activeChannelId.value);
  });

  function selectChannel(channelId: string) {
    activeChannelId.value = channelId;
  }

  function createChannel(name: string, type: ChannelType) {
    if (!currentUser.value) return;
    const newChannel = channelActionsService.createChannel(name, type, currentUser.value.id);
    channels.value = channelActionsService.getChannels();
    activeChannelId.value = newChannel.id;
    return newChannel;
  }

  function leaveChannel(channelId: string) {
    channelActionsService.leaveChannel(channelId);
    channels.value = channelActionsService.getChannels();
    if (activeChannelId.value === channelId) {
      activeChannelId.value = channels.value[0]?.id || null;
    }
  }

  function deleteChannel(channelId: string) {
    channelActionsService.deleteChannel(channelId);
    channels.value = channelActionsService.getChannels();
    if (activeChannelId.value === channelId) {
      activeChannelId.value = channels.value[0]?.id || null;
    }
  }

  function acceptInvite(inviteId: string) {
    const joinedChannel = channelActionsService.acceptInvite(inviteId);
    invitedChannels.value = channelActionsService.getInvitedChannels();
    channels.value = channelActionsService.getChannels();
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
    selectChannel,
    createChannel,
    leaveChannel,
    deleteChannel,
    acceptInvite,
    rejectInvite,
  };
}
