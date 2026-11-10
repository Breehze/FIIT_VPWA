import type { User } from '@vpwa/shared';

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

const API_URL = 'http://localhost:3333';

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
    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    await readResponse<{ message: string }>(response);
  }

  async getCurrentUser(): Promise<User | null> {
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
