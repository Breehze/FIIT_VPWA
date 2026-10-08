<template>
  <div>
    <q-list v-if="filteredMembers.length" dense bordered class="q-mx-sm q-mb-xs bg-white rounded-borders shadow-2">
      <q-item v-for="m in filteredMembers" :key="m.id" clickable @click="chooseMember(m.nick)">
        <q-avatar size="22px" color="primary" text-color="white" class="q-mr-sm">{{ m.name[0] }}</q-avatar>
        <span>{{ m.name }} <small class="text-grey-6">@{{ m.nick }}</small></span>
      </q-item>
    </q-list>

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
  import { ref, computed } from 'vue';
  import { useChat } from '@/composables/useChat';
  import { useChannels } from '@/composables/useChannels';
  import { useCommands } from '@/composables/useCommands';

  const { sendMsg } = useChat();
  const { activeChannelMembers } = useChannels();
  const { execCommand } = useCommands();

  const typed = ref('');
  const mentionMatch = computed(() => {
    return typed.value.match(/@([a-zA-Z0-9_-]*)$/);
  });

  const filteredMembers = computed(() =>{
    if(!mentionMatch.value){
      return [];
    }
    const query = mentionMatch.value[1] ?? '' ;
    return activeChannelMembers.value.filter((member) =>{
      return member.nick.startsWith(query);
    })
  })

  function onSubmit(){
    const inputMsg = typed.value.trim();
    if(!inputMsg){ return; }
    if(inputMsg.startsWith('/')){
      execCommand(inputMsg);
    }else{
      sendMsg(inputMsg);
    }

    typed.value = '';
  }

  function chooseMember(nick: string){
    typed.value = typed.value.replace(/@([a-zA-Z0-9_-]*)$/, `@${nick} `);
  }

</script>
