<template>
  <div>
    <q-list
      v-if="filteredMembers.length"
      bordered
      class="q-mx-md q-mb-md bg-white rounded-borders mention-list"
    >
      <q-item-label header class="mention-heading text-uppercase"> MENTION A MEMBER </q-item-label>

      <q-separator class="separator" />
      <q-item
        v-for="m in filteredMembers"
        :key="m.id"
        clickable
        @click="chooseMember(m.nick)"
        class="member items-center q-py-sm"
      >
        <q-avatar
          size="30px"
          :style="{ backgroundColor: getAvatarColor(m) }"
          text-color="white"
          class="q-mr-sm"
          >{{ m.name[0] }}</q-avatar
        >
        <q-item-section>
          <q-item-label> {{ m.name }} {{ m.lastName }} </q-item-label>

          <q-item-label caption class="profile-nickname"> @{{ m.nick }} </q-item-label>
        </q-item-section>

        <q-item-section side>
          <span class="member-state">
            <span class="status-dot q-mr-sm" :class="m.state.toLowerCase()" />
            {{ m.state }}
          </span>
        </q-item-section>
      </q-item>
    </q-list>

    <q-input
      class="q-mb-sm q-mx-sm q-py-xs cmd"
      v-model="typed"
      dense
      borderless
      placeholder="type something wonderful..."
      type="textarea"
      autogrow
      @keydown.enter.prevent="onSubmit"
    >
      <template #prepend>🌸</template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useChat } from '@/composables/useChat';
import { useChannels } from '@/composables/useChannels';
import { useCommands } from '@/composables/useCommands';
import { useAvatar } from '@/composables/useAvatar';

const { getAvatarColor } = useAvatar();
const { sendMsg } = useChat();
const { activeChannelMembers } = useChannels();
const { execCommand } = useCommands();

const typed = ref('');
const mentionMatch = computed(() => {
  return typed.value.match(/@([a-zA-Z0-9_-]*)$/);
});

const filteredMembers = computed(() => {
  if (!mentionMatch.value) {
    return [];
  }
  const query = mentionMatch.value[1] ?? '';
  return activeChannelMembers.value.filter((member) => {
    return member.nick.startsWith(query);
  });
});

function onSubmit() {
  const inputMsg = typed.value.trim();
  if (!inputMsg) {
    return;
  }
  if (inputMsg.startsWith('/')) {
    execCommand(inputMsg);
  } else {
    sendMsg(inputMsg);
  }

  typed.value = '';
}

function chooseMember(nick: string) {
  typed.value = typed.value.replace(/@([a-zA-Z0-9_-]*)$/, `@${nick} `);
}
</script>

<style scoped lang="scss">
.mention-heading {
  color: $lilac-600;
  font-size: 10px;
}

.mention-list {
  border-radius: 15px;
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

.member:hover {
  background: $lilac-100;

  :deep(.q-focus-helper) {
    opacity: 0;
  }
}

.member-state {
  display: flex;
  align-items: center;

  color: $lilac-300;
  font-size: 11px;
}

&::-webkit-scrollbar {
  width: 6px;
}

&::-webkit-scrollbar-track {
  background: $lilac-50;
}

&::-webkit-scrollbar-thumb {
  background: $lilac-300;
  border-radius: 10px;
}

&::-webkit-scrollbar-thumb:hover {
  background: $lilac-500;
}

@supports not selector(::-webkit-scrollbar) {
  .mention-list {
    scrollbar-width: thin;
    scrollbar-color: $lilac-300 $lilac-50;
  }
}

.cmd {
  border-radius: 20px;
  border: 2px solid $lilac-400;
}
</style>
