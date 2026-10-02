<template>
  <q-list dense>
    <q-item-label header class="text-weight-bold text-uppercase text-caption row items-center justify-between">
      <span>Channels</span>
      <q-btn flat round dense size="sm" icon="add" @click="emit('createClick')" />
    </q-item-label>

    <q-item
      v-for="channel in channels"
      :key="channel.id"
      clickable
      :active="channel.id === activeChannelId"
      active-class="bg-grey-3 text-primary text-weight-bold"
      @click="emit('selectChannel', channel)"
    >
      <q-item-section avatar style="min-width: 28px">
        <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="xs" />
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
  (e: 'createClick'): void;
}>();
</script>
