<template>
  <div v-if="invites.length > 0">
    <q-card class="invites-card">
      <q-item-label header class="invites-heading text-uppercase"> ✨ Invitations </q-item-label>

      <q-list dense>
        <q-item v-for="item in invites" :key="item.invite.id">
          <div class="row items-center full-width">
            <div class="row items-center q-gutter-xs">
              <span class="invite-icon">
                {{ item.channel.type === 'private' ? '🔒' : '#' }}
              </span>

              <span class="text-weight-medium">
                {{ item.channel.name }}
              </span>
            </div>

            <div class="text-caption full-width q-mb-sm">You've been invited!</div>

            <div class="invite-actions row full-width q-mb-sm">
              <q-btn
                class="accept-button col q-mr-sm"
                unelevated
                no-caps
                label="Accept"
                @click="emit('accept', item.invite.id)"
              />

              <q-btn
                class="decline-button col"
                unelevated
                no-caps
                label="Decline"
                @click="emit('reject', item.invite.id)"
              />
            </div>
          </div>
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

<style scoped lang="scss">
.invites-card {
  background: $blush-50;
  border: 1px solid $blush-200;
  border-radius: 15px;
  box-shadow: 0 3px 12px rgba(80, 55, 130, 0.15);
}

.invites-heading {
  color: $blush-500;
  font-size: 11px;
  font-weight: 600;
}

.invite-icon {
  font-size: 15px;
}

.accept-button,
.decline-button {
  height: 30px;
  border-radius: 12px;
  font-size: 12px;
}

.accept-button {
  color: white;
  background: linear-gradient(90deg, $blush-400, $lilac-400);
}

.decline-button {
  color: $blush-500;
  background: white;
  border: 1px solid $blush-200;
}
</style>
