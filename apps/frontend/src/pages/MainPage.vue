<template>
  <q-page class="column" style="height: 100vh; overflow: hidden">
    <template v-if="activeChannel">
      <ChannelHeader :channel="activeChannel" />
      <q-separator class="separator" />
    </template>
    <div v-if="channelsLoaded && !activeChannel" class="empty-chat col flex flex-center q-pa-lg">
      <div class="text-center">
        <div class="text-h6">No channels yet 🌸</div>
        <p class="q-mt-sm">Use <code>/join channelName</code> to start chatting.</p>
      </div>
    </div>
    <ChatFeed v-else class="q-pt-md" />
    <TypingStatus v-if="activeChannel" />
    <CmdLine />

    <Teleport to="#left-drawer" v-if="isMounted">
      <LeftSidebar />
    </Teleport>

    <Teleport to="#right-drawer" v-if="isMounted && activeChannel">
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
import TypingStatus from '@/components/TypingStatus.vue';
import { useAuth } from '@/composables/useAuth';
import { useChat } from '@/composables/useChat';
import { useTyping } from '@/composables/useTyping';
import { realtimeSocketService } from '@/services/realtimeSocket.service';

const isMounted = ref(false);

const { currentUser } = useAuth();
const {
  activeChannel,
  channelsLoaded,
  setChannels,
  resetChannels,
  setMembers,
  refreshKickVotes,
  setInvites,
  setUserPresence,
} = useChannels();
const { receiveMsg, loadInitialMsgs } = useChat();
const { updateTypingDraft, clearTypingDrafts } = useTyping();

watch(
  () => activeChannel.value?.id,
  (channelId) => {
    if (!channelId) return;
    void refreshKickVotes(channelId);
  },
);

watch(
  () => currentUser.value?.id,
  (userId) => {
    realtimeSocketService.stop();
    clearTypingDrafts();
    resetChannels();

    if (userId) {
      realtimeSocketService.start(userId, {
        onChannels: setChannels,
        onReconnect: () => void loadInitialMsgs(),
        onMessage: receiveMsg,
        onTyping: (channelId, draft) => {
          updateTypingDraft(channelId, draft);
        },
        onInvites: setInvites,
        onMembers: setMembers,
        onKickVote: (channelId) => void refreshKickVotes(channelId),
        onUserPresence: (users) => {
          setUserPresence(users);
          const ownPresence = users.find((user) => user.id === currentUser.value?.id);
          if (ownPresence && currentUser.value) {
            currentUser.value.state = ownPresence.state;
          }
        },
      });
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  realtimeSocketService.stop();
  clearTypingDrafts();
  resetChannels();
});

onMounted(() => {
  isMounted.value = true;
});
</script>

<style scoped lang="scss">
.empty-chat {
  background: $lilac-50;
  color: $lilac-700;
}

.empty-chat code {
  color: $lilac-800;
  background: $lilac-150;
  border-radius: 6px;
  padding: 2px 6px;
}
</style>
