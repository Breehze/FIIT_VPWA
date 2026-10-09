<template>
  <div>
    <q-form @submit="submitForm">
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col">
          <label class="form-label block q-mb-xs">First name</label>
          <q-input
            class="lilac-input"
            v-model="firstName"
            placeholder="John"
            outlined
            color="primary"
            :rules="[(val) => !!val || 'First name is required!']"
            hide-bottom-space
          />
        </div>

        <div class="col">
          <label class="form-label block q-mb-xs">Last name</label>
          <q-input
            class="lilac-input"
            v-model="lastName"
            placeholder="Doe"
            outlined
            color="primary"
            :rules="[(val) => !!val || 'Last name is required!']"
            hide-bottom-space
          />
        </div>
      </div>
      <div class="q-mb-md">
        <label class="form-label block q-mb-xs">Nickname</label>
        <q-input
          class="lilac-input"
          v-model="nickname"
          placeholder="john"
          outlined
          color="primary"
          :rules="[(val) => !!val || 'Nickname is required!']"
          hide-bottom-space
        >
          <template #prepend>@</template>
        </q-input>
        <p class="field-hint q-mt-xs q-mb-none">
          Your nickname is unique and is how others mention you.
        </p>
      </div>
      <div class="q-mb-md">
        <label class="form-label block q-mb-xs">Email</label>
        <q-input
          class="lilac-input"
          v-model="email"
          type="email"
          placeholder="john.doe@gmail.com"
          outlined
          color="primary"
          :rules="[
            (val) => !!val || 'Email is required!',
            (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Enter a valid email address!',
          ]"
          hide-bottom-space
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
          hide-bottom-space
        >
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>
      </div>
      <div class="q-mb-md">
        <label class="form-label block q-mb-xs">Repeat password</label>
        <q-input
          class="lilac-input"
          v-model="pwRepeat"
          :type="showRepeatPassword ? 'text' : 'password'"
          placeholder="Repeat your password"
          outlined
          color="primary"
          :rules="[
            (val) => !!val || 'Please repeat your password!',
            (val) => val === pw || 'Passwords not matching!',
          ]"
          hide-bottom-space
        >
          <template #append>
            <q-icon
              :name="showRepeatPassword ? 'visibility_off' : 'visibility'"
              @click="showRepeatPassword = !showRepeatPassword"
            />
          </template>
        </q-input>
      </div>
      <q-btn
        class="auth-button full-width q-mt-xs"
        label="Create account 🌸"
        type="submit"
        color="primary"
        unelevated
        no-caps
      />
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emits = defineEmits(['submitRegister']);

const firstName = ref('');
const lastName = ref('');
const nickname = ref('');
const email = ref('');
const pw = ref('');
const pwRepeat = ref('');
const showPassword = ref(false);
const showRepeatPassword = ref(false);

function submitForm(): void {
  emits('submitRegister', {
    nickname: nickname.value,
    password: pw.value,
    name: firstName.value,
    lastName: lastName.value,
    email: email.value,
  });
}
</script>

<style scoped lang="scss">
.field-hint {
  font-size: 12px;
  color: $lilac-400;
}
</style>
