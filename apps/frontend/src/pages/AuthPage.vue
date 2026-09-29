<template>
  <q-page class = "flex flex-center">
    <q-card class="q-pa-md flex">
      <div>
        <div>
          <q-btn label="Login" @click="isLoginForm = true"/>
          <q-btn label="Register" @click="isLoginForm = false"/>
        </div>
        <LoginForm v-if="isLoginForm" @submit-login="loginHandler"/>
        <RegisterForm v-else @submit-register="registerHandler"/>
      </div>
      <div class = 'q-ma-md gt-xs'>
        <h1>🥀</h1>
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
  import LoginForm from '@/components/LoginForm.vue';
  import RegisterForm from '@/components/RegisterForm.vue';
  import { ref } from 'vue';
  import { useAuth } from '@/composables/useAuth';

  const { login, register, currentUser } = useAuth();

  const isLoginForm = ref(true);

  async function loginHandler(loginInfo : {username:string, password:string}): Promise<void>{
    await login(loginInfo);
    console.log(currentUser.value);
  }

  async function registerHandler( registerInfo : {username:string, password:string}): Promise<void>{
    await register(registerInfo);
    isLoginForm.value = true;
  }


</script>
