import type { UserState } from '@vpwa/shared';
import { useAuth } from '@/composables/useAuth';
import { userActionsService } from '@/services/userActions.service';

export function useUserActions() {
  const { currentUser } = useAuth();

  async function updateStatus(newStatus: UserState): Promise<void> {
    if (!currentUser.value) return;
    try {
      const user = await userActionsService.updateStatus(newStatus);
      if (currentUser.value?.id === user.id) currentUser.value.state = user.state;
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  async function updateMentionOnlyNotif(notifOnly: boolean): Promise<void> {
    if (!currentUser.value) return;
    const user = await userActionsService.updateMentionOnlyNotif(notifOnly);
    if (currentUser.value?.id === user.id)
      currentUser.value.mentionOnlyNotif = user.mentionOnlyNotif;
  }

  return {
    updateStatus,
    updateMentionOnlyNotif,
  };
}
