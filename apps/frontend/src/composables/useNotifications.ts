import { reactive, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useAuth } from '@/composables/useAuth';

const unreadCounts = reactive<Record<string, number>>({});

const totalUnreadCount = computed(() =>
  Object.values(unreadCounts).reduce((total, count) => total + count, 0),
);

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

  function notifyIncomingMessage(
    senderId: string | null,
    senderName: string,
    messageText: string,
  ): void {
    const user = currentUser.value;
    if (!user || senderId === user.id || user.state !== 'Online' || $q.appVisible) return;
    if (user.mentionOnlyNotif) {
      const escapedNick = user.nick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`(^|[^\\w])@${escapedNick}(?![\\w-])`, 'i').test(messageText)) return;
    }
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    new Notification(`New message from ${senderName}`, { body: messageText.slice(0, 100) });
  }

  return {
    unreadCounts,
    getUnreadCount,
    markChannelAsRead,
    addUnreadMessage,
    removeChannelNotifications,
    totalUnreadCount,
    notifyIncomingMessage,
  };
}
