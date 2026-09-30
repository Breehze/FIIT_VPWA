<template>
  <q-page>
    <h1>This will be main page</h1>
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

const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});
</script>
