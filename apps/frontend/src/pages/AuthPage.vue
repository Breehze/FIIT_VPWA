<template>
  <q-page class="auth-page flex flex-center q-pa-md">
    <div class="auth-container full-width">
      <div class="brand flex flex-center q-mb-md">
        <div class="brand-logo flex flex-center">🌸</div>
        <h1 class="q-ma-none">Lilac</h1>
      </div>
      <div v-if="isLoginForm">
        <div class="auth-header text-center q-mb-lg">
          <h2 class="q-ma-none">Welcome back! ✨</h2>
          <p class="q-ma-none">Sign in to continue chatting</p>
        </div>
        <q-card class="auth-form q-pa-lg q-mb-lg" flat>
          <LoginForm @submit-login="loginHandler" />
          <p class="auth-switch text-center q-mt-md q-mb-none">
            New here?
            <span class="auth-switch-link" @click="isLoginForm = false">Create an account</span>
          </p>
        </q-card>
      </div>
      <div v-else>
        <div class="auth-header text-center q-mb-lg">
          <h2 class="q-ma-none">Create your account 🌸</h2>
          <p class="q-ma-none">Join the conversation</p>
        </div>
        <q-card class="auth-form q-pa-lg q-mb-lg" flat>
          <RegisterForm @submit-register="registerHandler" />
          <p class="auth-switch text-center q-mt-md q-mb-none">
            Already have an account?
            <span class="auth-switch-link" @click="isLoginForm = true">Sign in</span>
          </p>
        </q-card>
      </div>
      <div v-if="isLoginForm" class="stars row justify-center items-center" aria-hidden="true">
        <span>✦</span>
        <span class="middle-star">✦</span>
        <span>✦</span>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import LoginForm from '@/components/LoginForm.vue';
import RegisterForm from '@/components/RegisterForm.vue';
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';

const { login, register, currentUser } = useAuth();

const isLoginForm = ref(true);

async function loginHandler(loginInfo: { email: string; password: string }): Promise<void> {
  await login(loginInfo);
  console.log(currentUser.value);
}

async function registerHandler(registerInfo: {
  nickname: string;
  password: string;
  name: string;
  lastName: string;
  email: string;
}): Promise<void> {
  await register(registerInfo);
  isLoginForm.value = true;
}
</script>

<style scoped lang="scss">
.auth-container {
  max-width: 400px;
}

.brand {
  gap: 10px;

  h1 {
    font-family: Pacifico, cursive;
    font-size: 32px;
    color: $lilac-700;
    line-height: 1.2;
    font-weight: normal;
  }
}

.brand-logo {
  width: 42px;
  height: 42px;
  background: $lilac-400;
  color: white;
  border-radius: 12px;
  font-size: 18px;
}

.auth-header {
  h2 {
    font-size: 26px;
    font-weight: 700;
    color: $lilac-800;
    line-height: 1.3;
  }

  p {
    font-size: 15px;
    color: $lilac-700;
  }
}

.auth-switch {
  font-size: 14px;
  color: $lilac-400;

  .auth-switch-link {
    color: $lilac-600;
    font-weight: 600;
    cursor: pointer;
  }
}

.auth-form {
  border-radius: 20px;
  border: 1px solid $lilac-100;
}

.auth-page {
  background: $lilac-50;
}

.stars {
  gap: 12px;
  color: $lilac-400;

  .middle-star {
    color: $blush-400;
  }
}
</style>
