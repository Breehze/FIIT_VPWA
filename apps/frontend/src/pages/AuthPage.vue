<template>
  <q-page class="auth-page flex flex-center q-pa-md">
    <div class="auth-container">
      <div class="brand flex flex-center">
        <div class="brand-logo">✦</div>
        <h1>Lilac</h1>
      </div>
      <div v-if="isLoginForm">
        <div class="auth-header text-center">
          <h2>Welcome back! ✨</h2>
          <p>Sign in to continue chatting</p>
        </div>
        <div class="auth-form">
          <LoginForm @submit-login="loginHandler" />
          <p class="auth-switch">
            New here?
            <span class="auth-switch-link" @click="isLoginForm = false">Create an account</span>
          </p>
        </div>
      </div>
      <div v-else>
        <div class="auth-header text-center">
          <h2>Create your account 🌸</h2>
          <p>Join the conversation</p>
        </div>
        <div class="auth-form">
          <RegisterForm @submit-register="registerHandler" />
          <p class="auth-switch">
            Already have an account?
            <span class="auth-switch-link" @click="isLoginForm = true">Sign in</span>
          </p>
        </div>
      </div>
      <div class="stars" aria-hidden="true">
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
  username: string;
  password: string;
}): Promise<void> {
  await register(registerInfo);
  isLoginForm.value = true;
}
</script>

<style scoped lang="scss">
.auth-container {
  width: 100%;
  max-width: 400px;
}

.brand {
  gap: 10px;
  margin-bottom: 32px;

  h1 {
    font-family: Pacifico, cursive;
    font-size: 32px;
    color: $lilac-700;
    margin: 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-header {
  margin-bottom: 24px;
  h2 {
    font-size: 26px;
    font-weight: 700;
    color: $lilac-800;
    line-height: 1.3;
    margin: 0;
  }

  p {
    font-size: 15px;
    color: $lilac-700;
    margin: 0;
  }
}

.auth-switch {
  text-align: center;
  font-size: 14px;
  color: $lilac-400;
  margin-top: 20px;
  margin-bottom: 0;

  .auth-switch-link {
    color: $lilac-600;
    font-weight: 600;
    cursor: pointer;
  }
}

.auth-form {
  background: white;
  padding: 30px;
  border-radius: 20px;
  border: 1px solid $lilac-100;
  margin-bottom: 30px;
}

.auth-page {
  min-height: 100vh;
  background: $lilac-50;
}

.stars {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  color: $lilac-400;

  .middle-star {
    color: $blush-400;
  }
}
</style>
