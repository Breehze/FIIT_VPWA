<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card class="create-channel-card">
      <q-card-section class="text-center">
        <div class="text-h4 q-mb-md">🌺</div>
        <div class="text-h6">Create a channel</div>
        <div class="text-caption">Give your new conversation a cozy little home.</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <label class="text-caption text-weight-medium">Channel name</label>
        <q-input
          v-model.trim="name"
          class="lilac-input"
          maxlength="20"
          outlined
          color="primary"
          placeholder="study-buddies"
          :rules="[(val) => !!val || 'Channel name is required!']"
          autofocus
          @keyup.enter="handleCreate"
        >
          <template #prepend> # </template>
        </q-input>
        <div>
          <q-btn-toggle
            v-model="channelType"
            class="channel-type-toggle q-pa-sm"
            :options="[
              { label: '# Public', value: 'public' },
              { label: '🔒 Private', value: 'private' },
            ]"
            spread
            no-caps
            unelevated
            color="transparent"
            text-color="deep-purple-4"
            toggle-color="white"
            toggle-text-color="deep-purple-6"
          />
        </div>
      </q-card-section>

      <q-card-actions class="row justify-around q-mb-md q-mx-sm">
        <q-btn
          class="cancel-button col"
          color="primary"
          outline
          padding="12px 16px"
          no-caps
          label="Cancel"
          v-close-popup
        />
        <q-btn
          class="create-button col"
          color="white"
          flat
          padding="12px 16px"
          no-caps
          label="Create"
          :disable="!name"
          @click="handleCreate"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ChannelType } from '@vpwa/shared';

defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'create', payload: { name: string; type: ChannelType }): void;
}>();

const name = ref('');
const channelType = ref<ChannelType>('public');
function handleCreate() {
  if (!name.value) return;

  emit('create', {
    name: name.value,
    type: channelType.value,
  });

  name.value = '';
  channelType.value = 'public';
  emit('update:modelValue', false);
}
</script>

<style scoped lang="scss">
.create-channel-card {
  width: 400px;
  max-width: 90vw;
  border-radius: 20px;
}

.channel-type-toggle {
  border-radius: 18px;
  background-color: $lilac-100;

  :deep(.q-btn) {
    border-radius: 14px;
  }
}

.cancel-button {
  border-radius: 18px;
  &::before {
    border-color: $lilac-200;
  }
}

.create-button {
  border-radius: 18px;
  background-color: $lilac-200;
}
</style>
