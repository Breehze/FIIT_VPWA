import { reactive, computed } from 'vue';

const initialUnreadCounts: Record<string, number> = {
  'ch-1': 1,
  'ch-2': 1,
  'ch-3': 0,
};

const unreadCounts = reactive<Record<string, number>>({
  ...initialUnreadCounts,
});

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

  const totalUnreadCount = computed(() =>
    Object.values(unreadCounts).reduce((total, count) => total + count, 0),
  );

  return {
    unreadCounts,
    getUnreadCount,
    markChannelAsRead,
    addUnreadMessage,
    totalUnreadCount,
  };
}
