<template>
  <q-form @submit="submitForm">
    <div class="q-mb-md">
      <label class="form-label block q-mb-xs">Email</label>
      <q-input
        class="lilac-input"
        v-model="email"
        type="email"
        placeholder="you@example.com"
        outlined
        color="primary"
        :rules="[
          (val) => !!val || 'Email is required!',
          (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Enter a valid email address!',
          ]"
        hideBottomSpace
      />
    </div>
    <div class="q-mb-md">
      <label class="form-label block q-mb-xs">Password</label>
      <q-input
        class="lilac-input"
        v-model="pw"
        :type="showPassword ? 'text' : 'password'"
        placeholder="Enter your password"
        outlined
        color="primary"
        :rules="[
          (val) => !!val || 'Password is required!',
          (val) => val.length >= 8 || 'Password must contain at least 8 characters!',
        ]"
        hideBottomSpace
      >
        <template #append>
          <q-icon
            :name="showPassword ? 'visibility_off' : 'visibility'"
            @click="showPassword = !showPassword"
          />
        </template>
      </q-input>
    </div>
    <q-btn
      class="auth-button full-width q-mt-xs"
      label="Sign in"
      type="submit"
      color="primary"
      unelevated
      no-caps
    />
  </q-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emits = defineEmits(['submitLogin']);

const email = ref('');
const pw = ref('');
const showPassword = ref(false);

function submitForm(): void {
  emits('submitLogin', {
    email: email.value,
    password: pw.value,
  });
}
</script>
