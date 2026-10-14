<template>
  <q-card
    v-if="!closed"
    bordered
    class="vote-kick-card bg-deep-purple-2 text-deep-purple-10 text-weight-medium shadow-1 rounded-borders"
  >
    <q-card-section class="row items-center no-wrap q-px-md q-py-sm text-caption">
      <span class="col" role="status">
        Kick @{{ vote.target.nick }} · {{ vote.voterIds.length }} / {{ KICK_VOTE_THRESHOLD }} votes
      </span>
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

defineProps<{ vote: KickVoteProgress }>();
const closed = ref(false);
</script>

<style scoped>
.vote-kick-card {
  overflow-wrap: anywhere;
}
</style>
