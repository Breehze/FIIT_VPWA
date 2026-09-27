<template>
  <q-page class = "flex flex-center">
    <q-card class="q-pa-md flex">
      <div>
        <div>
          <q-btn label="Login" @click="isLoginForm = true"/>
          <q-btn label="Register" @click="isLoginForm = false"/>
        </div>
        <LoginForm v-if="isLoginForm"/>
        <RegisterForm v-else/>
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


</script>
