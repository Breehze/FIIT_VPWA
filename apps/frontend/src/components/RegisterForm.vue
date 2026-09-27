<template>
  <div>
    <q-form>
      <q-input v-model="usrname" label="Username"/>
      <q-input v-model="pw" label="Password" type="password"/>
      <q-input v-model="pwRepeat" label="Repeat Password" type="password"/>
      <div class="row justify-center q-ma-md">
        <q-btn label = "Register"/>
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  const usrname = ref("")
  const pw = ref("")
  const pwRepeat = ref();

</script>
