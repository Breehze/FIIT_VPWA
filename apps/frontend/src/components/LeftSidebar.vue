<template>
  <div class="left-sidebar column no-wrap overflow-hidden window-height q-pa-sm">
    <div class="brand row items-center q-ma-md">
      <div class="brand-logo flex flex-center">🌸</div>
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
      :current-user-id="currentUser?.id"
      @select-channel="onSelectChannel"
      @create-channel="showCreateChannel = true"
    />
    <CreateChannelDialog v-model="showCreateChannel" @create="handleCreateChannel" />

    <q-separator class="q-mt-auto q-mb-md" />

    <q-btn class="logout-button q-mb-sm" no-caps unelevated @click="logout">
      <q-icon name="logout" class="q-mr-sm" />
      <span>Log out</span>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import { useUserActions } from '@/composables/useUserActions';
import { useChannels } from '@/composables/useChannels';
import ProfileCard from './ProfileCard.vue';
import PendingInvites from './PendingInvites.vue';
import ChannelList from './ChannelList.vue';
import CreateChannelDialog from '@/components/CreateChannelDialog.vue';
import type { Channel, ChannelType } from '@vpwa/shared';
import { ref } from 'vue';

const { currentUser, logout } = useAuth();
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

const showCreateChannel = ref(false);

function onSelectChannel(channel: Channel) {
  selectChannel(channel.id);
}

function handleCreateChannel(payload: { name: string; type: ChannelType }) {
  createChannel(payload.name, payload.type);
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

.logout-button {
  background: $lilac-50;
  border-radius: 12px;
  border: 1px solid transparent;
  box-shadow: 0 3px 12px rgba(80, 55, 130, 0.15);

  &:hover {
    :deep(.q-focus-helper) {
      opacity: 0;
    }

    background: $blush-50;
    color: $blush-500;
    border-color: $peach-300;
  }
}
</style>
