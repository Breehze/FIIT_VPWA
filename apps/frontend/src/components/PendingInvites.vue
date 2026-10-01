<template>
  <div v-if="invites.length > 0">
    <q-card flat bordered class="bg-amber-1 q-pa-xs">
      <q-item-label header class="text-weight-bold text-caption text-amber-9 q-py-xs">
        Invitations ({{ invites.length }})
      </q-item-label>

      <q-list dense>
        <q-item v-for="item in invites" :key="item.invite.id" class="q-px-xs">
          <q-item-section avatar style="min-width: 24px">
            <q-icon
              :name="item.channel.type === 'private' ? 'lock' : 'tag'"
              size="xs"
              color="amber-9"
            />
          </q-item-section>

          <q-item-section class="text-weight-medium">
            {{ item.channel.name }}
          </q-item-section>

          <q-item-section side>
            <div class="row q-gutter-xs">
              <q-btn flat round dense size="sm" icon="check" color="positive"
                @click="emit('accept', item.invite.id)"
              />
              <q-btn flat round dense size="sm" icon="close"color="negative"
                @click="emit('reject', item.invite.id)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import type { InvitedChannel } from '@/services/channelActions.service';

defineProps<{
  invites: InvitedChannel[];
}>();

const emit = defineEmits<{
  (e: 'accept', inviteId: string): void;
  (e: 'reject', inviteId: string): void;
}>();
</script>
