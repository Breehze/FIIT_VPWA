<template>
  <div>
    <q-card flat class="text-left text-subtitle1 q-pa-md">
      <span v-if="channel">
        <span v-if="channel.type === 'private'">🔒</span>
        <q-icon v-else name="tag" size="xs" class="tag-icon" />
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

<style scoped lang="scss">
.tag-icon {
  color: $lilac-400;
}
</style>
