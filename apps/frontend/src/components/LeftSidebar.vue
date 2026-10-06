<template>
  <div class="left-sidebar column no-wrap overflow-hidden window-height q-pa-sm">
    <div class="brand row items-center q-ma-md">
      <div class="brand-logo flex flex-center">✦</div>
      <h1 class="q-ma-none">Lilac</h1>
    </div>
    <ProfileCard :user="currentUser" @status-change="updateStatus" />
    <PendingInvites
      class="q-mt-sm"
      :invites="invitedChannels"
      @accept="acceptInvite"
      @reject="rejectInvite"
    />
    <ChannelList
      class="col scroll q-mt-sm"
      :channels="channels"
      :active-channel-id="activeChannelId"
      @select-channel="onSelectChannel"
    />

    <q-btn class="q-mt-auto" @click="logout">Logout</q-btn>
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


  const { currentUser, logout } = useAuth();
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

<style scoped lang="scss">
.left-sidebar {
  background: $lilac-100;
}

.brand {
  gap: 7px;

  h1 {
    font-family: 'Pacifico', cursive;
    font-size: 24px;
    font-weight: normal;
    line-height: 1.2;
    color: $lilac-700;
  }
}

.brand-logo {
  width: 32px;
  height: 32px;
  background: $lilac-400;
  color: white;
  border-radius: 10px;
  font-size: 16px;
}
</style>
