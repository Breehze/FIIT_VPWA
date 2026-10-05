<template>
  <div ref="scrollContainer" class="col scroll q-px-xl q-py-md">
    <q-infinite-scroll :key="activeChannel?.id ?? ''" reverse @load="onLoad">
      <q-chat-message
        v-for="msg in activeMsgs"
        :key="msg.id"
        :name="getSender(msg.senderId)?.name"
        :text="[msg.textContent]"
        :stamp="new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })"
        :bg-color="isMentioned(msg.textContent) ? 'amber-2' : undefined"
      >
        <template #avatar>
          <q-avatar color="primary" text-color="white" class="q-message-avatar q-message-avatar--received">
            {{ getInitials(msg.senderId) }}
          </q-avatar>
        </template>
      </q-chat-message>
    </q-infinite-scroll>
  </div>
</template>

<script setup lang="ts">
  import { watch, nextTick, ref } from 'vue';
  import { useChat } from '@/composables/useChat';
  import { useChannels } from '@/composables/useChannels';
  import { useAuth } from '@/composables/useAuth';

  const { activeChannel } = useChannels();
  const { currentUser } = useAuth();
  const { activeMsgs, hasMoreMsgs, scrollTriggers , loadFollowingMsgs, getSender } = useChat();

  const scrollContainer = ref<HTMLElement | null>(null);

  function getInitials(senderId: string): string {
    const user = getSender(senderId);
    if (!user) return '?';
    return `${user.name.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  function onLoad(index: number, done: (stop?: boolean) => void) {
    loadFollowingMsgs();
    done(!hasMoreMsgs.value);
  }

  function isMentioned(msgText : string) : boolean {
    const nick = currentUser.value?.nick;
    if(!nick){
      return false;
    }
    return new RegExp(`@${nick}\\b`).test(msgText);
  }

  watch(
    scrollTriggers,
    async () => {
      await nextTick(
        () =>{
          if(scrollContainer.value){
            scrollContainer.value.scrollTo({top: scrollContainer.value.scrollHeight});
        }
      })
    }
  )
</script>
