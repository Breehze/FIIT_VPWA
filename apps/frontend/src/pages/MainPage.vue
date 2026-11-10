<template>
  <q-page class="column" style="height: 100vh; overflow: hidden">
    <ChannelHeader :channel="activeChannel" />
    <q-separator class="separator"></q-separator>
    <ChatFeed class="q-pt-md" />
    <CmdLine />

    <Teleport to="#left-drawer" v-if="isMounted">
      <LeftSidebar />
    </Teleport>

    <Teleport to="#right-drawer" v-if="isMounted">
      <RightSidebar />
    </Teleport>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import LeftSidebar from '@/components/LeftSidebar.vue';
import RightSidebar from '@/components/RightSidebar.vue';
import ChannelHeader from '@/components/ChannelHeader.vue';
import { useChannels } from '@/composables/useChannels';
import ChatFeed from '@/components/ChatFeed.vue';
import CmdLine from '@/components/CmdLine.vue';
import { useAuth } from '@/composables/useAuth';
import { useChat } from '@/composables/useChat';
import { realtimeSocketService } from '@/services/realtimeSocket.service';

const isMounted = ref(false);

const { currentUser } = useAuth();
const {
  activeChannel,
  channels,
  refreshChannels,
  refreshMembers,
  setInvites,
  setOnlineUsers,
  setMemberStatus,
} = useChannels();
const { receiveMsg, loadInitialMsgs } = useChat();

watch(
  () => currentUser.value?.id,
  (userId) => {
    realtimeSocketService.stop();
    if (userId) {
      realtimeSocketService.start(userId, {
        async refreshChannels() {
          await refreshChannels();
          await loadInitialMsgs();
          return channels.value.map((channel) => channel.id);
        },
        onMessage: receiveMsg,
        onInvites: setInvites,
        onPresence: (channelId) => void refreshMembers(channelId),
        onOnlineUsers: setOnlineUsers,
        onStatus: (userId, state) => {
          setMemberStatus(userId, state);
          if (currentUser.value?.id === userId) currentUser.value.state = state;
        },
      });
    }
  },
  { immediate: true },
);

onUnmounted(() => realtimeSocketService.stop());

onMounted(() => {
  isMounted.value = true;
});
</script>
