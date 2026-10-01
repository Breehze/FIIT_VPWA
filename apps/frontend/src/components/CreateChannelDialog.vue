<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 320px" class="q-pa-sm">
      <q-card-section>
        <div class="text-h6">Create Channel</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-model.trim="name"
          dense
          outlined
          label="Channel Name"
          maxlength="20"
          :rules="[(val) => !!val || 'Channel name is required!']"
          autofocus
          @keyup.enter="handleCreate"
        />
        <div class="q-mt-sm">
          <q-toggle v-model="isPrivate" label="Private Channel" />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          flat
          label="Create"
          color="primary"
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
const isPrivate = ref(false);

function handleCreate() {
  if (!name.value) return;

  emit('create', {
    name: name.value,
    type: isPrivate.value ? 'private' : 'public',
  });

  name.value = '';
  isPrivate.value = false;
  emit('update:modelValue', false);
}
</script>
