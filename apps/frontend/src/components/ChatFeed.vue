<template>
  <div ref="scrollContainer" class="col scroll q-px-xl q-py-md message-scroll">
    <div v-if="voteError" class="text-negative q-mb-sm" role="alert">{{ voteError }}</div>
    <div
      v-if="activeChannel?.type === 'public' && activeKickVotes.length"
      class="vote-kick-overlay column q-gutter-y-sm q-mb-md"
    >
      <VoteKickCard
        v-for="vote in activeKickVotes"
        :key="`${activeChannel.id}:${vote.targetId}:${vote.votes}`"
        :vote="vote"
        :current-user-id="currentUser?.id"
        :owner-id="activeChannel.owner"
        @vote="handleVote"
      />
    </div>
    <q-infinite-scroll
      v-if="activeChannel && activeMsgs.length"
      :key="activeChannel.id"
      reverse
      @load="onLoad"
    >
      <div
        v-for="msg in activeMsgs"
        :key="msg.id"
        class="message-row q-mb-md"
        :class="{
          'mentioned-message': isMentioned(msg.textContent),
        }"
      >
        <div v-if="isMentioned(msg.textContent)" class="mention-label text-uppercase q-mb-sm">
          🌷 For you
        </div>
        <div class="row items-start no-wrap">
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

          <div class="col message-content q-ml-sm q-mt-xs">
            <div class="row items-center q-gutter-x-sm">
              <span>
                {{ getSenderName(msg.senderId) }}
              </span>

              <span v-if="getSender(msg.senderId)" class="message-info text-caption">
                @{{ getSender(msg.senderId)?.nick }}
              </span>

              <span class="message-info text-caption">
                {{
                  new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }}
              </span>
            </div>

            <div class="message-text q-mt-xs">
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
      </div>
    </q-infinite-scroll>
  </div>
</template>

<script setup lang="ts">
import { watch, nextTick, ref } from 'vue';
import { useChat } from '@/composables/useChat';
import { useChannels } from '@/composables/useChannels';
import { useAvatar } from '@/composables/useAvatar';
import { useAuth } from '@/composables/useAuth';
import VoteKickCard from '@/components/VoteKickCard.vue';

const { currentUser } = useAuth();
const { getAvatarColor } = useAvatar();
const { activeChannel, activeChannelMembers, activeKickVotes, kickMember } = useChannels();
const { activeMsgs, hasMoreMsgs, scrollTriggers, loadFollowingMsgs, getSender } = useChat();
const voteError = ref<string | null>(null);

async function handleVote(nick: string): Promise<void> {
  if (!activeChannel.value) return;
  voteError.value = null;
  try {
    await kickMember(activeChannel.value.id, nick);
  } catch (error) {
    voteError.value = error instanceof Error ? error.message : 'Could not cast vote';
  }
}

const scrollContainer = ref<HTMLElement | null>(null);

function getMessageAvatarColor(senderId: string | null): string {
  const user = getSender(senderId);

  if (!user) return '#cbd5e1';

  return getAvatarColor(user);
}

function isMentioned(text: string): boolean {
  const nick = currentUser.value?.nick;

  if (!nick) return false;

  return splitMessage(text).some((part) => part.toLowerCase() === `@${nick.toLowerCase()}`);
}

function getSenderName(senderId: string | null): string {
  if (!senderId) return 'DeletedUser';
  const user = getSender(senderId);
  return user ? `${user.name} ${user.lastName}`.trim() : 'Unknown user';
}

function getInitials(senderId: string | null): string {
  if (!senderId) return 'DU';
  const user = getSender(senderId);
  if (!user) return '?';
  return `${user.name.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

async function onLoad(index: number, done: (stop?: boolean) => void) {
  await loadFollowingMsgs();
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
.vote-kick-overlay {
  position: sticky;
  top: 0;
  z-index: 1;
}
.profile-avatar {
  flex-shrink: 0;

  :deep(.q-avatar__content) {
    font-size: 18px;
  }
}

.message-row {
  max-width: 100%;
}

.message-content {
  min-width: 0;
}

.message-text {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
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

.mention-label {
  color: $blush-500;
  font-size: 10px;
}

.mentioned-message {
  background-color: $blush-50;
  border: 1px solid $blush-200;
  border-radius: 12px;
  padding: $space-base;
}

.message-scroll {
  background-color: $lilac-50;
  min-height: 0;
  overflow-x: hidden;

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
