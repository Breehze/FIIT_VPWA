<template>
  <div class="q-pa-sm">
    <ProfileCard :user="currentUser" @status-change="updateStatus" />
    <ChannelList
      class="q-mt-sm"
      :channels="channels"
      :active-channel-id="activeChannelId"
      @select-channel="onSelectChannel"
    />
  </div>
</template>

<script setup lang="ts">
  import { useAuth } from '@/composables/useAuth';
  import { useUserActions } from '@/composables/useUserActions';
  import { useChannels } from '@/composables/useChannels';
  import ProfileCard from './ProfileCard.vue';
  import ChannelList from './ChannelList.vue';
  import type { Channel } from '@vpwa/shared';

  const { currentUser } = useAuth();
  const { updateStatus } = useUserActions();
  const { channels, activeChannelId, selectChannel } = useChannels();

  function onSelectChannel(channel: Channel) {
    selectChannel(channel.id);
  }
</script>


