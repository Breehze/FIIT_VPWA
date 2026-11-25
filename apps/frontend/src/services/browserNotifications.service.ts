import { readonly, ref } from 'vue';

const permission = ref<NotificationPermission | 'unsupported'>('unsupported');
const requestingPermission = ref(false);

function refreshPermission(): void {
  permission.value =
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported';
}

async function requestPermission(): Promise<void> {
  refreshPermission();
  if (permission.value !== 'default' || requestingPermission.value) return;

  requestingPermission.value = true;
  try {
    await Notification.requestPermission();
  } catch (error) {
    console.error('Failed to request notification permission:', error);
  } finally {
    requestingPermission.value = false;
    refreshPermission();
  }
}

function show(title: string, body: string): void {
  refreshPermission();
  if (permission.value !== 'granted') return;

  try {
    new Notification(title, { body });
  } catch (error) {
    console.error('Failed to display notification:', error);
  }
}

export const browserNotificationsService = {
  permission: readonly(permission),
  requestingPermission: readonly(requestingPermission),
  refreshPermission,
  requestPermission,
  show,
};
