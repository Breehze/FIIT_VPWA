import type { User } from '@vpwa/shared';
import { MOCK_USERS } from '@/mocks';
import { API_URL } from '@/config/api';

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  nickname: string;
  password: string;
  passwordConfirmation: string;
  name?: string;
  lastName?: string;
  email: string;
}

const USE_MOCK = false;

interface UserApiResponse {
  data: {
    user: User;
  };
}

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = body as { errors?: { message?: string }[] } | null;
    throw new Error(error?.errors?.[0]?.message ?? `Request failed (${response.status})`);
  }

  return body as T;
}

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

    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const result = await readResponse<UserApiResponse>(response);
    return result.data.user;
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

    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        nick: data.nickname,
        email: data.email,
        password: data.password,
        passwordConfirmation: data.passwordConfirmation,
        name: data.name ?? null,
        lastName: data.lastName ?? null,
      }),
    });

    const result = await readResponse<UserApiResponse>(response);
    return result.data.user;
  }

  async logout(): Promise<void> {
    if (USE_MOCK) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      return;
    }

    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    await readResponse<{ message: string }>(response);
  }

  getUserFromStorage(): User | null {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  }

  async getCurrentUser(): Promise<User | null> {
    if (USE_MOCK) {
      return this.getUserFromStorage();
    }

    const response = await fetch(`${API_URL}/user`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 401) {
      return null;
    }

    return await readResponse<User>(response);
  }
}

export const authService = new AuthService();
