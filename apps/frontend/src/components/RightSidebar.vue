<template>
  <div>
    <q-list>
      <q-item v-for="member in activeChannelMembers" :key="member.id">
        <q-card class="full-width">
          <q-card-section class="row items-center no-wrap q-pa-sm">
            <q-avatar size="36px" color="primary" text-color="white">
              {{ getInitials(member) }}
            </q-avatar>
            <div class="column q-ml-sm">
              <div>{{ `${member.name} ${member.lastName}` }}</div>
              <div>{{ `@${member.nick}` }}</div>
            </div>
            <div class="q-ml-auto" v-show="member.id === activeChannel?.owner ">👑</div>
          </q-card-section>
        </q-card>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
  import { useChannels } from '@/composables/useChannels';
  import type { User } from '@vpwa/shared';

  const { activeChannel, activeChannelMembers } = useChannels();

  function getInitials(member: User ): string {
    if (!member) return '?';
    return `${member.name.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();
  }
</script>
