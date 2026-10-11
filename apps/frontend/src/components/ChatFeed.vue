<template>
  <div ref="scrollContainer" class="col scroll q-px-xl q-py-md message-scroll">
    <q-infinite-scroll :key="activeChannel?.id ?? ''" reverse @load="onLoad">
      <div v-for="msg in activeMsgs" :key="msg.id" class="row items-start no-wrap q-mb-md">
        <q-avatar
          :style="{
            backgroundColor: getMessageAvatarColor(msg.senderId),
          }"
          text-color="white"
          size="40px"
          class="profile-avatar"
        >
          {{ getInitials(msg.senderId) }}
        </q-avatar>

        <div class="col q-ml-sm q-mt-xs">
          <div class="row items-center q-gutter-x-sm">
            <span>
              {{ getSender(msg.senderId)?.name }}
              {{ getSender(msg.senderId)?.lastName }}
            </span>

            <span class="message-info text-caption"> @{{ getSender(msg.senderId)?.nick }} </span>

            <span class="message-info text-caption">
              {{
                new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              }}
            </span>
          </div>

          <div class="q-mt-xs">
            <span
              v-for="(part, index) in splitMessage(msg.textContent)"
              :key="index"
              :class="{ 'highlighted-mention': isValidMention(part) }"
            >
              {{ part }}
            </span>
          </div>
        </div>
      </div>
    </q-infinite-scroll>
  </div>
</template>

<script setup lang="ts">
import { watch, nextTick, ref } from 'vue';
import { useChat } from '@/composables/useChat';
import { useChannels } from '@/composables/useChannels';
import { useAvatar } from '@/composables/useAvatar';

const { getAvatarColor } = useAvatar();
const { activeChannel, activeChannelMembers } = useChannels();
const { activeMsgs, hasMoreMsgs, scrollTriggers, loadFollowingMsgs, getSender } = useChat();

const scrollContainer = ref<HTMLElement | null>(null);

function getMessageAvatarColor(senderId: string): string {
  const user = getSender(senderId);

  if (!user) return '#cbd5e1';

  return getAvatarColor(user);
}

function getInitials(senderId: string): string {
  const user = getSender(senderId);
  if (!user) return '?';
  return `${user.name.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

function onLoad(index: number, done: (stop?: boolean) => void) {
  loadFollowingMsgs();
  done(!hasMoreMsgs.value);
}

function splitMessage(text: string): string[] {
  return text.split(/(@[a-zA-Z0-9_-]+)/g);
}

function isValidMention(part: string): boolean {
  if (!part.startsWith('@')) return false;

  const nick = part.slice(1);

  return activeChannelMembers.value.some(
    (member) => member.nick.toLowerCase() === nick.toLowerCase(),
  );
}

watch(scrollTriggers, async () => {
  await nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTo({ top: scrollContainer.value.scrollHeight });
    }
  });
});
</script>

<style scoped lang="scss">
.profile-avatar {
  :deep(.q-avatar__content) {
    font-size: 18px;
  }
}

.message-info {
  color: $lilac-600;
}

.highlighted-mention {
  color: $lilac-600;
  background-color: $lilac-150;
  border-radius: 8px;
  padding: 1px 3px;
  font-weight: 600;
}

.message-scroll {
  background-color: $lilac-50;

  scrollbar-width: auto;
  scrollbar-color: $lilac-200 $lilac-50;

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: $lilac-50;
  }

  &::-webkit-scrollbar-thumb {
    background: $lilac-200;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: $lilac-500;
  }
}
</style>
