<template>
  <div>
    <q-card class="text-center q-pa-sm">
      <span v-if="channel">
        <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="xs" class="q-mr-xs" />
        {{ channel.name }}
      </span>
      <span v-else>Silence kills</span>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import type { Channel } from '@vpwa/shared';

defineProps<{
  channel: Channel | null;
}>();
</script>
