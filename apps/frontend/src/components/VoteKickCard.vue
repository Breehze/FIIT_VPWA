<template>
  <q-card
    v-if="!closed"
    bordered
    class="vote-kick-card bg-deep-purple-2 text-deep-purple-10 text-weight-medium shadow-1 rounded-borders"
  >
    <q-card-section class="row items-center no-wrap q-px-md q-py-sm text-caption">
      <span class="col" role="status">
        Kick @{{ vote.nick }} · {{ vote.votes }} / {{ KICK_VOTE_THRESHOLD }} votes
      </span>
      <q-btn
        v-if="vote.targetId !== currentUserId && (!vote.votedByMe || currentUserId === ownerId)"
        flat
        dense
        no-caps
        size="sm"
        :label="currentUserId === ownerId ? 'Kick now' : 'Vote'"
        @click="emit('vote', vote.nick)"
      />
      <q-btn
        flat
        round
        dense
        size="sm"
        icon="close"
        class="q-ml-sm"
        aria-label="Dismiss kick vote"
        @click="closed = true"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { KICK_VOTE_THRESHOLD, type KickVoteProgress } from '@/services/channelActions.service';

defineProps<{ vote: KickVoteProgress; currentUserId: string | undefined; ownerId: string }>();
const emit = defineEmits<{ (event: 'vote', nick: string): void }>();
const closed = ref(false);
</script>

<style scoped>
.vote-kick-card {
  overflow-wrap: anywhere;
}
</style>
