<template>
  <q-list dense>
    <q-item-label header class="channel-header row items-center justify-between text-uppercase text-caption">
      <span>Channels</span>

      <q-btn flat round dense size="sm" icon="add" @click="emit('createChannel')" />
    </q-item-label>

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
        <q-icon v-else name="tag" size="xs" class="tag-icon" />
      </q-item-section>

      <q-item-section>
        {{ channel.name }}
      </q-item-section>

      <q-item-section side>
        <q-btn flat round dense size="sm" icon="more_horiz" @click.stop>
          <q-menu class="channel-menu">
            <q-list dense>
              <q-item class="leave-option q-ma-xs" clickable v-close-popup>
                <q-item-section>Leave channel</q-item-section>
              </q-item>

              <q-item
                v-if="channel.owner === currentUserId"
                clickable
                v-close-popup
                class="delete-option text-negative q-ma-xs"
              >
                <q-item-section>Delete channel</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import type { Channel } from '@vpwa/shared';

defineProps<{
  channels: Channel[];
  activeChannelId?: string | null;
  currentUserId?: string | undefined;
}>();

const emit = defineEmits<{
  (e: 'selectChannel', channel: Channel): void;
  (e: 'createChannel'): void;
}>();
</script>

<style scoped lang="scss">
.channel {
  border-radius: 10px;
  color: $lilac-600;
}

.channel:hover {
  background: $lilac-50;

  :deep(.q-focus-helper) {
    opacity: 0;
  }
}

.channel-active:hover {
  background: white;

  :deep(.q-focus-helper) {
    opacity: 0;
  }
}

.channel-active {
  color: $lilac-800;
  background: white;
}

.tag-icon {
  color: $lilac-400;
}

.channel-active .tag-icon {
  color: $lilac-600;
}

.channel-header {
  color: $lilac-600;
}
</style>

<style lang="scss">
.channel-menu {
  border-radius: 15px;
  overflow: hidden;

  .leave-option,
  .delete-option {
    border-radius: 15px;
  }

  .leave-option:hover {
    background: $lilac-100;

    .q-focus-helper {
      opacity: 0;
    }
  }

  .delete-option:hover {
    background: $blush-50;

    .q-focus-helper {
      opacity: 0;
    }
  }
}
</style>
