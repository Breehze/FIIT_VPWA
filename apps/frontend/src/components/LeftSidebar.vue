<template>
  <div class="q-pa-sm">
    <ProfileCard :user="currentUser" @status-change="updateStatus" />
    <PendingInvites class="q-mt-sm" :invites="invitedChannels"
      @accept="acceptInvite"
      @reject="rejectInvite"
    />
    <ChannelList class="q-mt-sm" :channels="channels" :active-channel-id="activeChannelId"
      @select-channel="onSelectChannel"
    />
  </div>
</template>

<script setup lang="ts">
  import { useAuth } from '@/composables/useAuth';
  import { useUserActions } from '@/composables/useUserActions';
  import { useChannels } from '@/composables/useChannels';
  import ProfileCard from './ProfileCard.vue';
  import PendingInvites from './PendingInvites.vue';
  import ChannelList from './ChannelList.vue';
  import type { Channel } from '@vpwa/shared';

  const { currentUser } = useAuth();
  const { updateStatus } = useUserActions();
  const {
    channels,
    invitedChannels,
    activeChannelId,
    selectChannel,
    acceptInvite,
    rejectInvite,
  } = useChannels();

  function onSelectChannel(channel: Channel) {
    selectChannel(channel.id);
  }
</script>


