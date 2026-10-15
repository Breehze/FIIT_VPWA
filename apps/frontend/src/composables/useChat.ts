import { ref, watch } from 'vue';
import type { Msg } from '@vpwa/shared';
import { chatActionsService } from '@/services/chatActions.service';
import { useChannels } from '@/composables/useChannels';
import { useAuth } from './useAuth';
import { useNotifications } from '@/composables/useNotifications';

const activeMsgs = ref<Msg[]>([]);
const hasMoreMsgs = ref(true);
const scrollTriggers = ref(0);
const missedMessages: Msg[] = [];

export function useChat() {
  const { activeChannel, refreshChannels } = useChannels();
  const { currentUser } = useAuth();
  const { addUnreadMessage, markChannelAsRead, notifyIncomingMessage } = useNotifications();

  watch(
    () => activeChannel.value?.id,
    (newChannelId) => {
      if (newChannelId) {
        loadInitialMsgs();
        markChannelAsRead(newChannelId);
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

      refreshChannels();

      for (const msg of missedMessages.splice(0)) {
        addUnreadMessage(msg.channelId, activeChannel.value?.id);
      }

      loadInitialMsgs();

      if (activeChannel.value) {
        markChannelAsRead(activeChannel.value.id);
      }
    },
  );

  function loadInitialMsgs(): void {
    const activeChannelId = activeChannel.value?.id ?? null;
    if (!activeChannelId) {
      return;
    }
    activeMsgs.value = chatActionsService.getChannelMessages(activeChannelId, 10);
    hasMoreMsgs.value = activeMsgs.value.length >= 10;
  }

  function loadFollowingMsgs(): void {
    const activeChannelId = activeChannel.value?.id ?? null;
    if (!activeMsgs.value.length || !activeChannelId) {
      return;
    }

    const lastMsgShown = activeMsgs.value[0];
    if (!lastMsgShown) {
      return;
    }

    const nextMsgs = chatActionsService.getChannelMessages(activeChannelId, 10, lastMsgShown.id);
    activeMsgs.value.unshift(...nextMsgs);

    if (nextMsgs.length < 10) {
      hasMoreMsgs.value = false;
    }
  }

  function sendMsg(msg: string) {
    const channelId = activeChannel.value?.id;
    const sender = currentUser.value?.id;
    if (!channelId || !sender) {
      return;
    }
    const newMsg = chatActionsService.sendMessage(channelId, sender, msg);
    activeMsgs.value.push(newMsg);
    scrollTriggers.value++;
  }

  function getSender(senderId: string) {
    return chatActionsService.getUserById(senderId);
  }

  function receiveMsg(newMsg: Msg): void {
    const activeChannelId = activeChannel.value?.id;

    if (newMsg.senderId === currentUser.value?.id) {
      return;
    }

    if (currentUser.value?.state === 'Offline') {
      missedMessages.push(newMsg);
      return;
    }

    const sender = getSender(newMsg.senderId);

    if (sender) {
      notifyIncomingMessage(
        newMsg.senderId,
        `${sender.name} ${sender.lastName}`,
        newMsg.textContent,
      );
    }

    if (newMsg.channelId === activeChannelId) {
      activeMsgs.value.push(newMsg);
      scrollTriggers.value++;
    } else {
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
