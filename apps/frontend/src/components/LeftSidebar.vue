<template>
  <div class="left-sidebar column no-wrap overflow-hidden window-height q-pa-sm">
    <div class="brand row items-center q-ma-md">
      <div class="brand-logo flex flex-center">🌸</div>
      <h1 class="q-ma-none">Lilac</h1>
    </div>
    <ProfileCard
      :user="currentUser"
      @status-change="updateStatus"
      @notification-change="handleNotificationChange"
    />
    <div v-if="notificationError" class="text-negative q-mx-md q-mt-sm" role="alert">
      {{ notificationError }}
    </div>
    <PendingInvites
      class="q-mt-sm"
      :invites="invitedChannels"
      :processing-invite-id="processingInviteId"
      @accept="handleAcceptInvite"
      @reject="handleRejectInvite"
    />

    <div v-if="inviteError" class="text-negative q-mx-md q-mt-sm" role="alert">
      {{ inviteError }}
    </div>
    <ChannelList
      class="col scroll q-mt-sm"
      :channels="channels"
      :active-channel-id="activeChannelId"
      :current-user-id="currentUser?.id"
      @select-channel="onSelectChannel"
      @create-channel="showCreateChannel = true"
    />
    <CreateChannelDialog
      v-model="showCreateChannel"
      :error-message="createChannelError"
      @create="handleCreateChannel"
    />
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
import { ref, watch } from 'vue';

const { currentUser, logout } = useAuth();
const { updateStatus, updateMentionOnlyNotif } = useUserActions();
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
const createChannelError = ref('');
const inviteError = ref<string | null>(null);
const processingInviteId = ref<string | null>(null);
const notificationError = ref<string | null>(null);

async function handleNotificationChange(mentionsOnly: boolean): Promise<void> {
  notificationError.value = null;
  try {
    await updateMentionOnlyNotif(mentionsOnly);
  } catch (error) {
    notificationError.value =
      error instanceof Error ? error.message : 'Failed to update notifications';
  }
}

async function processInviteResponse(inviteId: string, action: 'accept' | 'reject'): Promise<void> {
  if (processingInviteId.value) return;

  inviteError.value = null;
  processingInviteId.value = inviteId;

  try {
    if (action === 'accept') {
      await acceptInvite(inviteId);
    } else {
      await rejectInvite(inviteId);
    }
  } catch (error) {
    inviteError.value = error instanceof Error ? error.message : 'Failed to process invitation';
  } finally {
    processingInviteId.value = null;
  }
}

async function handleAcceptInvite(inviteId: string): Promise<void> {
  await processInviteResponse(inviteId, 'accept');
}

async function handleRejectInvite(inviteId: string): Promise<void> {
  await processInviteResponse(inviteId, 'reject');
}

watch(showCreateChannel, (isOpen) => {
  if (isOpen) {
    createChannelError.value = '';
  }
});

function onSelectChannel(channel: Channel) {
  selectChannel(channel.id);
}

async function handleCreateChannel(payload: { name: string; type: ChannelType }) {
  createChannelError.value = '';

  try {
    await createChannel(payload.name, payload.type);
    showCreateChannel.value = false;
  } catch (error) {
    createChannelError.value = error instanceof Error ? error.message : 'Failed to create channel';
  }
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
