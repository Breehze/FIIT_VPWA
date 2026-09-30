import type { UserState } from '@vpwa/shared';
import { useAuth } from '@/composables/useAuth';
import { userActionsService } from '@/services/userActions.service';

export function useUserActions() {
  const { currentUser } = useAuth();

  function updateStatus(newStatus: UserState) {
    if (currentUser.value) {
      currentUser.value.state = newStatus;
      userActionsService.updateStatus(newStatus);
    }
  }

  return {
    updateStatus,
  };
}
