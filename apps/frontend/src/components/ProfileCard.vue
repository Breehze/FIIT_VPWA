<template>
  <div v-if="user">
    <q-card class="profile-card q-pa-md">
      <div class="row items-center q-gutter-sm">
        <q-avatar class="profile-avatar" size="44px" text-color="white">
          {{ user.name[0] }}{{ user.lastName[0] }}
        </q-avatar>
        <div>
          <div>{{ user.name + ' ' + user.lastName }}</div>
          <div class="profile-nickname text-caption">{{ '@' + user.nick }}</div>
        </div>
      </div>

      <div class="q-mt-sm">
        <q-btn-dropdown
          class="status-dropdown full-width"
          :class="statusClass"
          content-class="status-menu"
          dense
          flat
          no-caps
        >
          <template #label>
            <div class="row items-center full-width justify-start">
              <span class="status-dot inline-block q-ma-sm" :class="statusClass"></span>
              <div>{{ user.state === 'DND' ? 'Do Not Disturb' : user.state }}</div>
            </div>
          </template>
          <q-list dense>
            <q-item
              class="status-option"
              clickable
              v-close-popup
              @click="emit('statusChange', 'Online')"
            >
              <q-item-section side>
                <span class="status-dot online"></span>
              </q-item-section>

              <q-item-section>
                <q-item-label>Online</q-item-label>
                <q-item-label caption> Messages and notifications enabled. </q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              class="status-option"
              clickable
              v-close-popup
              @click="emit('statusChange', 'DND')"
            >
              <q-item-section side>
                <span class="status-dot dnd"></span>
              </q-item-section>

              <q-item-section>
                <q-item-label>Do Not Disturb</q-item-label>
                <q-item-label caption> Messages enabled · notifications paused. </q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              class="status-option"
              clickable
              v-close-popup
              @click="emit('statusChange', 'Offline')"
            >
              <q-item-section side>
                <span class="status-dot offline"></span>
              </q-item-section>

              <q-item-section>
                <q-item-label>Offline</q-item-label>
                <q-item-label caption> Messages paused until you come back online. </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
      <div
        class="notification-setting q--avoid-card-border row items-start no-wrap q-mt-sm q-pa-sm"
      >
        <div class="notification-icon flex flex-center q-pa-xs q-mr-sm">
          <q-icon name="notifications_none" size="16px" />
        </div>

        <div class="notification-text col">
          <div class="text-weight-medium">Mentions only</div>
          <div class="notification-caption">Only notify me when someone mentions @{{ user.nick }}.</div>
        </div>

        <q-toggle
          v-model="mentionsOnly"
          color="primary"
          size="32px"
          aria-label="Mentions only notifications"
        />
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import type { User, UserState } from '@vpwa/shared';
import { useNotifications } from '@/composables/useNotifications';
import { computed } from 'vue';

const { mentionsOnly } = useNotifications();

const props = defineProps<{
  user: User | null;
}>();

const statusClass = computed(() => {
  if (props.user?.state === 'Online') {
    return 'online';
  }

  if (props.user?.state === 'DND') {
    return 'dnd';
  }

  return 'offline';
});

const emit = defineEmits<{
  (e: 'statusChange', status: UserState): void;
}>();
</script>

<style scoped lang="scss">
.profile-card {
  background: $lilac-50;
  border-radius: 15px;
  box-shadow: 0 3px 12px rgba(80, 55, 130, 0.15);
}

.profile-avatar {
  background: $lilac-300;

  :deep(.q-avatar__content) {
    font-size: 18px;
  }
}

.status-dot {
  width: 8px;
  height: 8px;
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

.status-dropdown {
  border-radius: 15px;
  height: 32px;
}

.status-dropdown.online {
  background: color-mix(in srgb, $status-online 15%, white);
}

.status-dropdown.offline {
  background: color-mix(in srgb, $status-offline 25%, white);
}

.status-dropdown.dnd {
  background: color-mix(in srgb, $status-dnd 20%, white);
}

.status-option {
  min-height: 56px;
}

.notification-setting {
  border: 1px solid $lilac-200;
  background: white;
  border-radius: 15px;
}

.notification-icon {
  background: $lilac-100;
  color: $lilac-500;
  border-radius: 8px;
}

.notification-caption {
  color: gray;
  font-size: 11px;
}
</style>

<style lang="scss">
.status-menu {
  border-radius: 15px;
  overflow: hidden;

  .status-option {
    .q-focus-helper {
      display: none;
    }

    &:hover {
      background-color: $lilac-100;
    }
  }
}
</style>
