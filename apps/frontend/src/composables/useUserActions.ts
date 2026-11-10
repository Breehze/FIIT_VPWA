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

  return {
    updateStatus,
  };
}
