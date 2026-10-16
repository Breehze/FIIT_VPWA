import { reactive, computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { DEFAULT_UNREAD_COUNTS } from '@/mocks';
import { useAuth } from '@/composables/useAuth';

const unreadCounts = reactive<Record<string, number>>({
  ...DEFAULT_UNREAD_COUNTS,
});

const totalUnreadCount = computed(() =>
  Object.values(unreadCounts).reduce((total, count) => total + count, 0),
);

const mentionsOnly = ref(false);

export function useNotifications() {
  const $q = useQuasar();
  const { currentUser } = useAuth();

  function getUnreadCount(channelId: string): number {
    return unreadCounts[channelId] ?? 0;
  }

  function markChannelAsRead(channelId: string): void {
    unreadCounts[channelId] = 0;
  }

  function addUnreadMessage(channelId: string, activeChannelId: string | undefined): void {
    if (channelId === activeChannelId) {
      return;
    }

    unreadCounts[channelId] = (unreadCounts[channelId] ?? 0) + 1;
  }

  function removeChannelNotifications(channelId: string): void {
    delete unreadCounts[channelId];
  }

  async function requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  function isMentioned(message: string, nick: string): boolean {
    const escapedNick = nick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^\\w])@${escapedNick}(?!\\w)`, 'i');

    return regex.test(message);
  }

  function notifyIncomingMessage(senderId: string, senderName: string, messageText: string): void {
    if (!currentUser.value || senderId === currentUser.value.id) {
      return;
    }

    if (currentUser.value.state !== 'Online') {
      return;
    }

    if ($q.appVisible) {
      return;
    }

    if (mentionsOnly.value && !isMentioned(messageText, currentUser.value.nick)) {
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    new Notification(`New message from ${senderName}`, {
      body: messageText.slice(0, 100),
    });
  }

  return {
    unreadCounts,
    getUnreadCount,
    markChannelAsRead,
    addUnreadMessage,
    removeChannelNotifications,
    totalUnreadCount,
    mentionsOnly,
    requestNotificationPermission,
    notifyIncomingMessage,
  };
}
