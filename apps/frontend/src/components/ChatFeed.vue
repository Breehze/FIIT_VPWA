<template>
  <div class="col scroll q-px-xl q-py-md">
    <q-infinite-scroll :key="activeChannel?.id ?? ''" reverse @load="onLoad">
      <q-chat-message
        v-for="msg in activeMsgs"
        :key="msg.id"
        :name="getSender(msg.senderId)?.name"
        :text="[msg.textContent]"
        :stamp="new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })"
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
import { useChat } from '@/composables/useChat';
import { useChannels } from '@/composables/useChannels';

const { activeChannel } = useChannels();
const { activeMsgs, hasMoreMsgs, loadFollowingMsgs, getSender } = useChat();

function getInitials(senderId: string): string {
  const user = getSender(senderId);
  if (!user) return '?';
  return `${user.name.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

function onLoad(index: number, done: (stop?: boolean) => void) {
  loadFollowingMsgs();
  done(!hasMoreMsgs.value);
}
</script>
