import { reactive, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useAuth } from '@/composables/useAuth';
import { browserNotificationsService } from '@/services/browserNotifications.service';

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

    if (!user) return;

    if (senderId === user.id) return;

    if (user.state !== 'Online') return;

    if ($q.appVisible) return;

    if (user.mentionOnlyNotif) {
      const escapedNick = user.nick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const mentionPattern = new RegExp(`(^|[^\\w])@${escapedNick}(?![\\w-])`, 'i');

      if (!mentionPattern.test(messageText)) return;
    }

    browserNotificationsService.show(`New message from ${senderName}`, messageText.slice(0, 100));
  }

  return {
    notificationPermission: browserNotificationsService.permission,
    enablingNotifications: browserNotificationsService.requestingPermission,
    enableNotifications: browserNotificationsService.requestPermission,
    refreshNotificationPermission: browserNotificationsService.refreshPermission,
    unreadCounts,
    getUnreadCount,
    markChannelAsRead,
    addUnreadMessage,
    removeChannelNotifications,
    totalUnreadCount,
    notifyIncomingMessage,
  };
}
