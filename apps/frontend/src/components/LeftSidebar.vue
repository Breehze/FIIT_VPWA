<template>
  <div class="q-pa-sm">
    <ProfileCard :user="currentUser" @status-change="updateStatus"/>
  </div>
</template>

<script setup lang="ts">
  import { useAuth } from '@/composables/useAuth';
  import { useUserActions } from '@/composables/useUserActions';
  import ProfileCard from './ProfileCard.vue';

  const { currentUser } = useAuth();
  const { updateStatus } = useUserActions();
</script>

