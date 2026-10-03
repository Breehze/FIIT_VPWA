import type { User } from '@vpwa/shared';
import { MOCK_USERS } from '@/mocks';

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  nickname: string;
  password?: string;
  name?: string;
  lastName?: string;
  email?: string;
}

const USE_MOCK = true;

class AuthService {
  async login(credentials: LoginDto): Promise<User> {
    if (USE_MOCK) {
      await delay(400);

      const matched = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === credentials.email.toLowerCase(),
      );

      const fallback = MOCK_USERS[0] ?? {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John',
        lastName: 'Doe',
        nick: 'john',
        email: credentials.email,
        state: 'Online',
        mentionOnlyNotif: false,
      };

      const user: User = matched ?? {
        ...fallback,
        email: credentials.email,
      };

      localStorage.setItem('auth_token', 'mock-jwt-token-xyz');
      localStorage.setItem('auth_user', JSON.stringify(user));

      return user;
    }

    throw new Error('Backend server is not connected yet.');
  }

  async register(data: RegisterDto): Promise<User> {
    if (USE_MOCK) {
      await delay(400);

      const newUser: User = {
        id: crypto.randomUUID(),
        name: data.name || data.nickname,
        lastName: data.lastName || '',
        nick: data.nickname,
        email: data.email || `${data.nickname.toLowerCase()}@vpwa.sk`,
        state: 'Online',
        mentionOnlyNotif: false,
      };

      MOCK_USERS.push(newUser);
      localStorage.setItem('auth_token', 'mock-jwt-token-xyz');
      localStorage.setItem('auth_user', JSON.stringify(newUser));

      return newUser;
    }

    throw new Error('Backend server is not connected yet.');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  getUserFromStorage(): User | null {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  }
}

export const authService = new AuthService();
