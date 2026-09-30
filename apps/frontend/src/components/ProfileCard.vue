<template>
  <div v-if="user">
    <q-card class="q-pa-sm bg-grey-2">
      <div class="row items-center q-gutter-sm">
        <q-avatar square size="44px" color="red" text-color="white" class="rounded-borders">
          PP
        </q-avatar>
        <div>
          <div class="text-weight-bold"> {{ user.name +  ' ' + user.lastName }} </div>
          <div class="text-caption text-grey-7">{{ '@' + user.nick }}</div>
        </div>
      </div>

      <div class="q-mt-sm">
        <q-btn-dropdown
          dense
          class="full-width"
          :color="user.state === 'Online' ? 'green-2' : user.state === 'DND' ? 'orange-2' : 'grey-4'"
          :text-color="user.state === 'Online' ? 'green-9' : user.state === 'DND' ? 'orange-9' : 'grey-9'"
          :label="user.state"
        >
          <q-list dense>
            <q-item clickable v-close-popup @click="emit('statusChange', 'Online')">
              <q-item-section>Online</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="emit('statusChange', 'DND')">
              <q-item-section>DND</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="emit('statusChange', 'Offline')">
              <q-item-section>Offline</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
  import type { User, UserState } from '@vpwa/shared';

  defineProps<{
    user: User | null;
  }>();

  const emit = defineEmits<{
    (e: 'statusChange', status: UserState): void;
  }>();
</script>
