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
        :rules="[(val) => !!val || 'Email is required!']"
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
        :rules="[(val) => !!val || 'Password is required!']"
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
      class="login-button full-width q-mt-xs"
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

<style scoped lang="scss">
.form-label {
  font-size: 14px;
  font-weight: 500;
  color: $lilac-700;
}

.lilac-input :deep(.q-field__control) {
  border-radius: 15px;
  height: 48px;
  background: $lilac-50;
}

.login-button {
  height: 48px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 700;
}
</style>
