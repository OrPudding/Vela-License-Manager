<template>
  <v-app>
    <v-main class="bg-surface">
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-12">
              <v-toolbar color="primary" dark>
                <v-toolbar-title>VelaOS License Manager</v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <v-form ref="form" @submit.prevent="handleLogin">
                  <v-text-field
                    v-model="username"
                    label="用户名"
                    prepend-icon="mdi-account"
                    :rules="[rules.required]"
                    required
                  />
                  <v-text-field
                    v-model="password"
                    label="密码"
                    prepend-icon="mdi-lock"
                    type="password"
                    :rules="[rules.required]"
                    required
                  />
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn
                  color="primary"
                  :loading="loading"
                  @click="handleLogin"
                >
                  登录
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

const rules = {
  required: (v: string) => !!v || '此字段为必填项',
}

const handleLogin = async () => {
  loading.value = true
  try {
    await authStore.login(username.value, password.value)
    router.push('/')
  } catch (error: any) {
    alert('登录失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}
</script>
