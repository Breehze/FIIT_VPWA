<template>
  <q-list dense>
    <q-item-label header class="channels-heading text-uppercase"> Channels </q-item-label>

    <q-item
      v-for="channel in channels"
      :key="channel.id"
      clickable
      :active="channel.id === activeChannelId"
      class="channel"
      active-class="channel-active"
      @click="emit('selectChannel', channel)"
    >
      <q-item-section avatar style="min-width: 28px">
        <span v-if="channel.type === 'private'">🔒</span>
        <q-icon v-else name="tag" size="xs" />
      </q-item-section>

      <q-item-section>
        {{ channel.name }}
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import type { Channel } from '@vpwa/shared';

defineProps<{
  channels: Channel[];
  activeChannelId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'selectChannel', channel: Channel): void;
}>();
</script>

<style scoped lang="scss">
.channels-heading {
  color: $lilac-600;
  font-size: 11px;
  font-weight: 600;
}

.channel {
  border-radius: 10px;
}
.channel-active {
  color: $lilac-700;
  background: white;
}
</style>
