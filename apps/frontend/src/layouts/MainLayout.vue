<template>
  <q-layout view="lhh lpR lfr">
    <q-drawer v-model="leftDrawerOpen" show-if-above side="left" bordered>
      <div id="left-drawer" class="full-height"></div>
    </q-drawer>

    <q-drawer v-model="showMemberList" show-if-above side="right" bordered>
      <div id="right-drawer"></div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useCommands } from '@/composables/useCommands';

  const { showMemberList } = useCommands();

  const leftDrawerOpen = ref(true);
</script>
