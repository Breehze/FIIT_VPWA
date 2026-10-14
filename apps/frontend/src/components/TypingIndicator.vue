<template>
  <div v-if="activeTypers.length" class="text-caption text-grey-7 q-mb-xs q-ml-sm">
    <span class="cursor-pointer text-weight-bold text-primary">
      {{ typingText }}

      <q-menu anchor="top start" self="bottom start">
        <q-card flat class="q-pa-sm" style="max-width: 320px">
          <div v-for="t in activeTypers" :key="t.nick" class="q-mb-xs">
            <span class="text-weight-bold">@{{ t.nick }}:</span>
            <span class="q-ml-xs text-italic">{{ t.draftText }}</span>
          </div>
        </q-card>
      </q-menu>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTyping } from '@/composables/useTyping';

const { activeTypers } = useTyping();

const typingText = computed(() => {
  const nicks = activeTypers.value.map((t) => `@${t.nick}`);
  if (nicks.length === 1) return `${nicks[0]} is typing...`;
  if (nicks.length === 2) return `${nicks[0]} and ${nicks[1]} are typing...`;
  return `${nicks[0]}, ${nicks[1]} and others are typing...`;
});
</script>
