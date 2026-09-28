<template>
  <div class="flex flex-center">
    <q-form @submit="submitForm">
      <q-input
        v-model="usrname"
        label="Username"
        :rules="[
          val => !!val || 'Missing username!',
        ]"
        hideBottomSpace
      />
      <q-input
        v-model="pw"
        label="Password"
        type="password"
        :rules="[
          val => !!val || 'Forgot password!',
        ]"
        hideBottomSpace
      />
      <div class="row justify-center q-ma-md">
        <q-btn label= "Login" type="submit"/>
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  const emits = defineEmits(["submitLogin"]);

  const usrname = ref("");
  const pw = ref("");

  function submitForm() : void{
    emits("submitLogin",{
      username : usrname.value,
      password : pw.value
    })
  }

</script>
