import { reactive, computed } from 'vue';

const unreadCounts = reactive<Record<string, number>>({});

const totalUnreadCount = computed(() =>
  Object.values(unreadCounts).reduce((total, count) => total + count, 0),
);

export function useNotifications() {
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

  return {
    unreadCounts,
    getUnreadCount,
    markChannelAsRead,
    addUnreadMessage,
    removeChannelNotifications,
    totalUnreadCount,
  };
}
