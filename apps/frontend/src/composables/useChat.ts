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
const receivedMessageKeys = new Set<string>();
const MAX_TRACKED_MESSAGES = 1000;

export function useChat() {
  const { activeChannel, activeChannelMembers } = useChannels();
  const { currentUser } = useAuth();
  const { addUnreadMessage, markChannelAsRead, notifyIncomingMessage } = useNotifications();

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

  watch(
    () => currentUser.value?.state,
    (newStatus, oldStatus) => {
      if (oldStatus !== 'Offline' || newStatus !== 'Online') {
        return;
      }

      void loadInitialMsgs().catch((error) => {
        console.error('Failed to refresh messages:', error);
      });
    },
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
    const user = currentUser.value;

    if (!user) return;

    if (user.state === 'Offline') return;

    const activeChannelId = activeChannel.value?.id;
    const messageKey = `${user.id}:${newMsg.channelId}:${newMsg.id}`;

    if (receivedMessageKeys.has(messageKey)) return;

    if (
      newMsg.channelId === activeChannelId &&
      activeMsgs.value.some((msg) => msg.id === newMsg.id)
    ) {
      return;
    }

    receivedMessageKeys.add(messageKey);

    if (receivedMessageKeys.size > MAX_TRACKED_MESSAGES) {
      const oldestKey = receivedMessageKeys.values().next().value;

      if (oldestKey !== undefined) {
        receivedMessageKeys.delete(oldestKey);
      }
    }

    if (newMsg.senderId !== user.id) {
      const sender = getSender(newMsg.senderId);

      notifyIncomingMessage(
        newMsg.senderId,
        sender ? `${sender.name} ${sender.lastName}`.trim() : 'Someone',
        newMsg.textContent,
      );
    }

    if (newMsg.channelId === activeChannelId) {
      activeMsgs.value.push(newMsg);
      scrollTriggers.value++;
    } else if (newMsg.senderId !== user.id) {
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
