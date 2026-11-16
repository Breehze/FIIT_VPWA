<template>
  <div v-if="activeDrafts.length > 0" class="typing-status row items-center q-px-md q-py-xs">
    <q-icon name="edit" size="15px" class="q-mr-sm" />

    <template v-for="(draft, index) in activeDrafts" :key="draft.userId">
      <span v-if="index > 0" class="q-mx-xs">
        {{ index === activeDrafts.length - 1 ? 'and' : ',' }}
      </span>

      <q-btn
        flat
        dense
        no-caps
        class="typing-nickname"
        :label="draft.nick"
        @click="openPreview(draft.userId)"
      />
    </template>

    <span class="q-ml-xs">
      {{ activeDrafts.length === 1 ? 'is typing...' : 'are typing...' }}
    </span>
  </div>

  <q-dialog v-model="previewOpen">
    <q-card class="draft-dialog">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">
          @{{ selectedDraft?.nick ?? 'User' }}'s draft
        </div>
        <div class="draft-caption">Live message preview</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="draft-preview">
          {{ selectedDraft?.text ?? 'No active draft.' }}
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat no-caps color="primary" label="Close" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useChannels } from '@/composables/useChannels';
import { useAuth } from '@/composables/useAuth';
import { useTyping } from '@/composables/useTyping';

const { activeChannel } = useChannels();
const { currentUser } = useAuth();
const { typingDrafts } = useTyping();

const previewOpen = ref(false);
const selectedUserId = ref<string | null>(null);

const activeDrafts = computed(() => {
  const channelId = activeChannel.value?.id;

  if (!channelId) return [];

  return Object.values(typingDrafts[channelId] ?? {}).filter(
    (draft) => draft.userId !== currentUser.value?.id,
  );
});

const selectedDraft = computed(() => {
  return activeDrafts.value.find((draft) => draft.userId === selectedUserId.value);
});

function openPreview(userId: string): void {
  selectedUserId.value = userId;
  previewOpen.value = true;
}

watch(
  () => activeChannel.value?.id,
  () => {
    previewOpen.value = false;
    selectedUserId.value = null;
  },
);

watch(selectedDraft, (draft) => {
  if (previewOpen.value && !draft) {
    previewOpen.value = false;
    selectedUserId.value = null;
  }
});
</script>

<style scoped lang="scss">
.typing-status {
  min-height: 32px;
  background: $lilac-50;
  border-top: 1px solid $lilac-200;
  color: $lilac-600;
  font-size: 12px;
  flex-shrink: 0;
}

.typing-nickname {
  color: $lilac-700;
  font-size: 12px;
  font-weight: 600;
  text-decoration: underline;
  padding: 0 2px;
  min-height: 24px;

  &:hover {
    color: $lilac-800;
    background: $lilac-100;
  }
}

.draft-dialog {
  width: 440px;
  max-width: 90vw;
  border-radius: 15px;
  background: $lilac-50;
  color: $lilac-800;
}

.draft-caption {
  color: gray;
  font-size: 11px;
  margin-top: 4px;
}

.draft-preview {
  min-height: 80px;
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  background: white;
  border: 1px solid $lilac-200;
  border-radius: 10px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 13px;
}
</style>
