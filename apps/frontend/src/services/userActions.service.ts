import type { UserState } from '@vpwa/shared';

class UserActionsService {
  updateStatus(state: UserState): void {
    const raw = localStorage.getItem('auth_user');
    if (raw) {
      const user = JSON.parse(raw);
      user.state = state;
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  }
}

export const userActionsService = new UserActionsService();
