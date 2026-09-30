<template>
  <q-form @submit="submitForm">
    <div class="form-field">
      <label>Email</label>
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
    <div class="form-field">
      <label>Password</label>
      <q-input
        class="lilac-input"
        v-model="pw"
        :type="showPassword ? 'text' : 'password'"
        placeholder="••••••••"
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
    <q-btn class="login-button" label="Sign in" type="submit" color="primary" unelevated no-caps />
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
.form-field {
  margin-bottom: 18px;
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: $lilac-700;
    margin-bottom: 6xp;
  }
}

.lilac-input :deep(.q-field__control) {
  border-radius: 15px;
  height: 48px;
  background: $lilac-50;
}

.login-button {
  margin-top: 6px;
  height: 48px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 700;
  width: 100%;
}
</style>
