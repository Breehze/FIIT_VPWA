import { getCurrentScope, onScopeDispose, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useChannels } from '@/composables/useChannels';
import { useChat } from '@/composables/useChat';
import { useNotifications } from '@/composables/useNotifications';
import { useTyping } from '@/composables/useTyping';
import { realtimeSocketService } from '@/services/realtimeSocket.service';

let sessionActive = false;

// Called once by MainPage. Consumers of useChat/useChannels do not start effects.
export function useChatSession(): void {
  if (sessionActive) {
    throw new Error('useChatSession must only be called once');
  }
  if (!getCurrentScope()) {
    throw new Error('useChatSession requires an active Vue scope');
  }

  const { currentUser } = useAuth();
  const {
    activeChannel,
    setChannels,
    resetChannels,
    setMembers,
    setKickVotes,
    setInvites,
    setUserPresence,
  } = useChannels();
  const { receiveMsg, loadInitialMsgs, resetChat } = useChat();
  const { markChannelAsRead } = useNotifications();
  const { updateTypingDraft, clearTypingDrafts } = useTyping();

  function clearSession(): void {
    realtimeSocketService.stop();
    clearTypingDrafts();
    resetChannels();
    resetChat();
  }

  sessionActive = true;
  onScopeDispose(() => {
    try {
      clearSession();
    } finally {
      sessionActive = false;
    }
  });

  watch(
    () => currentUser.value?.id,
    (userId) => {
      clearSession();
      if (!userId) return;

      realtimeSocketService.start(userId, {
        onChannels: setChannels,
        onReconnect: () => void loadInitialMsgs(),
        onMessage: receiveMsg,
        onTyping: updateTypingDraft,
        onInvites: setInvites,
        onMembers: setMembers,
        onKickVotes: setKickVotes,
        onUserPresence: (users) => {
          setUserPresence(users);
          const ownPresence = users.find((user) => user.id === currentUser.value?.id);
          if (ownPresence && currentUser.value) {
            currentUser.value.state = ownPresence.state;
          }
        },
      });
    },
    { immediate: true, flush: 'sync' },
  );

  watch(
    () => activeChannel.value?.id,
    (channelId) => {
      if (!channelId) {
        resetChat();
        return;
      }
      markChannelAsRead(channelId);
      void loadInitialMsgs();
    },
    { immediate: true },
  );

  watch(
    () => currentUser.value?.state,
    (status, previousStatus) => {
      if (previousStatus === 'Offline' && (status === 'Online' || status === 'DND')) {
        void loadInitialMsgs();
      }
    },
  );
}
