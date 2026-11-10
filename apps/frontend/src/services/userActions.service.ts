import type { User, UserState } from '@vpwa/shared';

const API_URL = 'http://localhost:3333';

class UserActionsService {
  async updateStatus(state: UserState): Promise<User> {
    const response = await fetch(`${API_URL}/user/set_status`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ status: state }),
    });
    if (!response.ok) throw new Error(`Failed to update status (${response.status})`);
    return (await response.json()) as User;
  }

  async updateMentionOnlyNotif(notifOnly: boolean): Promise<User> {
    const response = await fetch(`${API_URL}/user/set_mention_only_notif`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ notif_only: notifOnly }),
    });
    if (!response.ok)
      throw new Error(`Failed to update notification preferences (${response.status})`);
    return (await response.json()) as User;
  }
}

export const userActionsService = new UserActionsService();
