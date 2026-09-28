<template>
  <div>
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
          val => !!val || 'Password is empty!',
        ]"
        hideBottomSpace
      />
      <q-input
        v-model="pwRepeat"
        label="Repeat Password"
        type="password"
        :rules="[
          val => !!val || 'Repeat pw pls!',
          val => val === pw || 'Passwords not matching!'
        ]"
        hideBottomSpace
      />
      <div class="row justify-center q-ma-md">
        <q-btn label = "Register" type="submit"/>
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  const emits = defineEmits(["submitRegister"]);

  const usrname = ref("");
  const pw = ref("");
  const pwRepeat = ref();

  function submitForm() : void{
    emits("submitRegister",{
      username : usrname.value,
      password : pw.value
    })
  }

</script>
