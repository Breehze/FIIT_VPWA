<template>
  <div >
    <q-input
      outlined dense
      class="q-mb-sm q-mx-sm"
      v-model="typed"
      placeholder="type something wonderful..."
      type="textarea"
      autogrow
      @keydown.enter.prevent="onSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useChat } from '@/composables/useChat';

  const { sendMsg } = useChat();

  const typed = ref('');

  function onSubmit(){
    const inputMsg = typed.value.trim();
    if(!inputMsg){ return; }
    sendMsg(inputMsg);
    typed.value = '';
  }

</script>
