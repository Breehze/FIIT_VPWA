<template>
  <div class="member-list window-height overflow-hidden">
    <div class="q-ml-md q-mt-md">Members of #{{ activeChannel?.name }}</div>

    <div class="q-ml-md channel-member-count text-caption">
      🌷 {{ activeChannelMembers.length }} total
    </div>

    <q-separator class="q-my-md" />

    <div v-for="group in memberGroups" :key="group.state">
      <div v-if="group.members.length > 0">
        <div class="row items-center justify-start">
          <span class="q-ml-md q-mr-sm status-dot" :class="group.color"></span>

          <div class="status-caption text-caption text-uppercase">
            {{ group.label }} — {{ group.members.length }}
          </div>
        </div>

        <q-list>
          <q-item v-for="member in group.members" :key="member.id" class="q-py-xs">
            <q-card flat class="full-width bg-transparent">
              <q-card-section class="row items-center no-wrap q-pa-sm">
                <div class="avatar-wrapper">
                  <q-avatar
                    class="profile-avatar"
                    size="36px"
                    :style="{ backgroundColor: getAvatarColor(member, true) }"
                    text-color="white"
                  >
                    {{ getInitials(member) }}
                  </q-avatar>

                  <span class="avatar-status-dot" :class="member.state.toLowerCase()"></span>
                </div>

                <div class="column q-ml-sm">
                  <div>{{ `${member.name} ${member.lastName}` }}</div>
                  <div class="text-caption profile-nickname">{{ `@${member.nick}` }}</div>
                </div>

                <div class="admin q-ml-auto q-px-xs" v-show="member.id === activeChannel?.owner">
                  👑
                </div>
              </q-card-section>
            </q-card>
          </q-item>
        </q-list>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChannels } from '@/composables/useChannels';
import type { User, UserState } from '@vpwa/shared';
import { computed } from 'vue';
import { useAvatar } from '@/composables/useAvatar';

const { getAvatarColor } = useAvatar();
const { activeChannel, activeChannelMembers } = useChannels();
const memberGroups = computed(() => {
  const statuses: { state: UserState; label: string; color: string }[] = [
    { state: 'Online', label: 'Online', color: 'online' },
    { state: 'DND', label: 'Do not disturb', color: 'dnd' },
    { state: 'Offline', label: 'Offline', color: 'offline' },
  ];

  return statuses.map((status) => ({
    ...status,
    members: activeChannelMembers.value.filter((member) => member.state === status.state),
  }));
});

function getInitials(member: User): string {
  if (!member) return '?';
  return `${member.name.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();
}
</script>

<style scoped lang="scss">
.member-list {
  background: $lilac-50;
}

.channel-member-count {
  color: $lilac-300;
}

.profile-avatar {
  :deep(.q-avatar__content) {
    font-size: 14px;
  }
}

.status-dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.status-dot.online {
  background: $status-online;
}

.status-dot.dnd {
  background: $status-dnd;
}

.status-dot.offline {
  background: $status-offline;
}

.status-caption {
  color: $lilac-500;
  font-size: 11px;
}

.avatar-wrapper {
  position: relative;
  display: inline-flex;
}

.avatar-status-dot {
  position: absolute;
  bottom: 0;
  right: 0;

  width: 10px;
  height: 10px;
  border-radius: 50%;

  border: 2px solid white;
}

.avatar-status-dot.online {
  background: $status-online;
}

.avatar-status-dot.dnd {
  background: $status-dnd;
}

.avatar-status-dot.offline {
  background: $status-offline;
}

.admin {
  background: $peach-50;
  border: 1px solid $peach-300;
  border-radius: 10px;
}
</style>
