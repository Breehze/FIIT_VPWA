import { ref, watch } from 'vue';
import type { Msg } from '@vpwa/shared';
import { fetchChannelMessages } from '@/services/chatActions.service';
import { realtimeSocketService } from '@/services/realtimeSocket.service';
import { useChannels } from '@/composables/useChannels';
import { useAuth } from './useAuth';
import { useNotifications } from '@/composables/useNotifications';

const activeMsgs = ref<Msg[]>([]);
const hasMoreMsgs = ref(true);
const scrollTriggers = ref(0);
let loadVersion = 0;

export function useChat() {
  const { activeChannel, activeChannelMembers } = useChannels();
  const { currentUser } = useAuth();
  const { addUnreadMessage, markChannelAsRead } = useNotifications();

  watch(
    () => activeChannel.value?.id,
    (newChannelId) => {
      if (newChannelId) {
        void loadInitialMsgs();
        markChannelAsRead(newChannelId);
      } else {
        activeMsgs.value = [];
      }
    },
    { immediate: true },
  );

  async function loadInitialMsgs(): Promise<void> {
    const activeChannelId = activeChannel.value?.id ?? null;
    const version = ++loadVersion;
    if (!activeChannelId) return;
    activeMsgs.value = [];
    try {
      const messages = await fetchChannelMessages(activeChannelId);
      if (version !== loadVersion || activeChannel.value?.id !== activeChannelId) return;
      activeMsgs.value = [
        ...new Map(
          [...messages, ...activeMsgs.value.filter((m) => m.channelId === activeChannelId)].map(
            (m) => [m.id, m],
          ),
        ).values(),
      ].sort((a, b) => a.id - b.id);
      hasMoreMsgs.value = messages.length >= 10;
      scrollTriggers.value++;
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  async function loadFollowingMsgs(): Promise<void> {
    const activeChannelId = activeChannel.value?.id ?? null;
    if (!activeMsgs.value.length || !activeChannelId) {
      return;
    }

    const lastMsgShown = activeMsgs.value[0];
    if (!lastMsgShown) {
      return;
    }

    try {
      const nextMsgs = await fetchChannelMessages(activeChannelId, 10, lastMsgShown.id);
      if (activeChannel.value?.id !== activeChannelId) return;
      activeMsgs.value = [
        ...nextMsgs.filter((m) => !activeMsgs.value.some((existing) => existing.id === m.id)),
        ...activeMsgs.value,
      ];
      hasMoreMsgs.value = nextMsgs.length >= 10;
    } catch (error) {
      console.error('Failed to load older messages:', error);
    }
  }

  async function sendMsg(msg: string): Promise<void> {
    const channelId = activeChannel.value?.id;
    if (!channelId) throw new Error('Select a channel first');
    await realtimeSocketService.sendMessage(channelId, msg);
  }

  function getSender(senderId: string | null) {
    if (!senderId) return undefined;
    return (
      activeChannelMembers.value.find((member) => member.id === senderId) ??
      (currentUser.value?.id === senderId ? currentUser.value : undefined)
    );
  }

  function receiveMsg(newMsg: Msg): void {
    const activeChannelId = activeChannel.value?.id;

    if (newMsg.channelId === activeChannelId) {
      if (activeMsgs.value.some((msg) => msg.id === newMsg.id)) return;
      activeMsgs.value.push(newMsg);
      scrollTriggers.value++;
    } else if (newMsg.senderId !== currentUser.value?.id) {
      addUnreadMessage(newMsg.channelId, activeChannelId);
    }
  }

  return {
    activeMsgs,
    hasMoreMsgs,
    scrollTriggers,
    loadInitialMsgs,
    loadFollowingMsgs,
    getSender,
    sendMsg,
    receiveMsg,
  };
}
