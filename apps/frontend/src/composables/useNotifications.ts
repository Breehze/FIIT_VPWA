import { ref, reactive, computed } from 'vue';

const initialUnreadCounts: Record<string, number> = {
  'ch-1': 1,
  'ch-2': 1,
  'ch-3': 0,
};

const unreadCounts = reactive<Record<string, number>>({
  ...initialUnreadCounts,
});

const unreadBoundaries = reactive<Record<string, number>>({
  ...initialUnreadCounts,
});

const visibleUnreadDividerChannel = ref<string | null>(null);

export function useNotifications() {
  function getUnreadCount(channelId: string): number {
    return unreadCounts[channelId] ?? 0;
  }

  function markChannelAsRead(channelId: string): void {
    if (unreadCounts[channelId] && unreadCounts[channelId] > 0) {
      visibleUnreadDividerChannel.value = channelId;
    } else {
      visibleUnreadDividerChannel.value = null;
    }

    unreadCounts[channelId] = 0;
  }

  function getUnreadBoundary(channelId: string): number {
    return unreadBoundaries[channelId] ?? 0;
  }

  const totalUnreadCount = computed(() =>
    Object.values(unreadCounts).reduce((total, count) => total + count, 0),
  );

  return {
    unreadCounts,
    getUnreadCount,
    getUnreadBoundary,
    markChannelAsRead,
    visibleUnreadDividerChannel,
    totalUnreadCount,
  };
}
