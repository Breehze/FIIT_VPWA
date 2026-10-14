import type { User } from '@vpwa/shared';

export const MOCK_USERS: User[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John',
    lastName: 'Doe',
    nick: 'john',
    email: 'john@example.com',
    state: 'Online',
    mentionOnlyNotif: false,
  },
  {
    id: '999e4567-e89b-12d3-a456-426614174999',
    name: 'Alice',
    lastName: 'Smith',
    nick: 'alice',
    email: 'alice@example.com',
    state: 'Offline',
    mentionOnlyNotif: false,
  },
  {
    id: '888e4567-e89b-12d3-a456-426614174888',
    name: 'Bob',
    lastName: 'Jones',
    nick: 'bob',
    email: 'bob@example.com',
    state: 'DND',
    mentionOnlyNotif: false,
  },
  {
    id: '777e4567-e89b-12d3-a456-426614174777',
    name: 'Charlie',
    lastName: 'Brown',
    nick: 'charlie',
    email: 'charlie@example.com',
    state: 'Online',
    mentionOnlyNotif: false,
  },
  {
    id: '666e4567-e89b-12d3-a456-426614174666',
    name: 'Diana',
    lastName: 'Prince',
    nick: 'diana',
    email: 'diana@example.com',
    state: 'Online',
    mentionOnlyNotif: false,
  },
];

export function getMockUserById(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}

export function getMockUserByNick(nick: string): User | undefined {
  return MOCK_USERS.find((u) => u.nick === nick);
}
