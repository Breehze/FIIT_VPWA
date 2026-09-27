<template>
  <div class="flex flex-center">
    <q-form>
      <q-input v-model="usrname" label="Username"/>
      <q-input v-model="pw" label="Password" type="password"/>
      <div class="row justify-center q-ma-md">
        <q-btn label= "Login"/>
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  const usrname = ref("")
  const pw = ref("")

</script>
