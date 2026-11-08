import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { User } from '@vpwa/shared';
import { authService, type LoginDto, type RegisterDto } from '@/services/auth.service';

const currentUser = ref<User | null>(null);
const isLoading = ref(false);
const isInitialized = ref(false);

let initializationPromise: Promise<User | null> | null = null;

export async function initializeAuth(): Promise<User | null> {
  if (isInitialized.value) {
    return currentUser.value;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  isLoading.value = true;

  initializationPromise = (async () => {
    try {
      const user = await authService.getCurrentUser();

      currentUser.value = user;
      isInitialized.value = true;

      return user;
    } finally {
      isLoading.value = false;
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

export function useAuth() {
  const router = useRouter();

  const isAuthenticated = computed(() => !!currentUser.value);

  async function login(credentials: LoginDto) {
    isLoading.value = true;
    try {
      const user = await authService.login(credentials);
      currentUser.value = user;
      isInitialized.value = true;
      await router.push('/chat');
    } finally {
      isLoading.value = false;
    }
  }

  async function register(data: RegisterDto) {
    isLoading.value = true;
    try {
      return await authService.register(data);
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    isLoading.value = true;
    try {
      await authService.logout();
      currentUser.value = null;
      isInitialized.value = true;
      await router.push('/');
    } finally {
      isLoading.value = false;
    }
  }

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    isInitialized,
    initializeAuth,
    login,
    register,
    logout,
  };
}
