import type { UserState } from '@vpwa/shared';

export interface PresenceUser {
  id: string;
  state: UserState;
}

export interface PresenceSnapshot {
  users: PresenceUser[];
}
