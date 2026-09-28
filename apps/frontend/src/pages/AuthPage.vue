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

  const isLoginForm = ref(true);

  function loginHandler(login : {username:string, password:string}): void{
    console.log(login.username);
    console.log(login.password);
  }

  function registerHandler(login : {username:string, password:string}): void{
    console.log(login.username);
    console.log(login.password);
  }


</script>
