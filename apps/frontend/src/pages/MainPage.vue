<template>
  <q-page class="column" style="height: 100vh; overflow: hidden">
    <ChannelHeader :channel="activeChannel" />
    <ChatFeed />
    <Teleport to="#left-drawer" v-if="isMounted">
      <LeftSidebar />
    </Teleport>

    <Teleport to="#right-drawer" v-if="isMounted">
      <RightSidebar />
    </Teleport>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import LeftSidebar from '@/components/LeftSidebar.vue';
import RightSidebar from '@/components/RightSidebar.vue';
import ChannelHeader from '@/components/ChannelHeader.vue';
import { useChannels } from '@/composables/useChannels';
import ChatFeed from '@/components/ChatFeed.vue';

const isMounted = ref(false);

const { activeChannel } = useChannels();

onMounted(() => {
  isMounted.value = true;
});
</script>
