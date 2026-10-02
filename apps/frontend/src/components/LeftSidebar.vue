<template>
  <div class="q-pa-sm">
    <ProfileCard :user="currentUser" @status-change="updateStatus" />
    <PendingInvites class="q-mt-sm" :invites="invitedChannels"
      @accept="acceptInvite"
      @reject="rejectInvite"
    />
    <ChannelList class="q-mt-sm" :channels="channels" :active-channel-id="activeChannelId"
      @select-channel="onSelectChannel"
      @create-click="isCreateDialogOpen = true"
    />
    <CreateChannelDialog v-model="isCreateDialogOpen" @create="onCreateChannel" />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useAuth } from '@/composables/useAuth';
  import { useUserActions } from '@/composables/useUserActions';
  import { useChannels } from '@/composables/useChannels';
  import ProfileCard from './ProfileCard.vue';
  import PendingInvites from './PendingInvites.vue';
  import ChannelList from './ChannelList.vue';
  import CreateChannelDialog from './CreateChannelDialog.vue';
  import type { Channel, ChannelType } from '@vpwa/shared';

  const { currentUser } = useAuth();
  const { updateStatus } = useUserActions();
  const {
    channels,
    invitedChannels,
    activeChannelId,
    selectChannel,
    createChannel,
    acceptInvite,
    rejectInvite,
  } = useChannels();

  const isCreateDialogOpen = ref(false);

  function onSelectChannel(channel: Channel) {
    selectChannel(channel.id);
  }

  function onCreateChannel(payload: { name: string; type: ChannelType }) {
    createChannel(payload.name, payload.type);
  }
</script>


