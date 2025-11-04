<template>
  <v-app>
    <v-main class="bg-surface">
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="6" lg="5">
            <v-card class="elevation-12">
              <v-toolbar color="primary" dark>
                <v-toolbar-title>VelaOS License Manager - 初始化向导</v-toolbar-title>
              </v-toolbar>

              <v-card-text>
                <v-stepper v-model="step" alt-labels>
                  <v-stepper-header>
                    <v-stepper-item :complete="step > 1" :value="1" title="创建管理员" />
                    <v-divider />
                    <v-stepper-item :complete="step > 2" :value="2" title="配置爱发电" />
                    <v-divider />
                    <v-stepper-item :complete="step > 3" :value="3" title="创建产品" />
                    <v-divider />
                    <v-stepper-item :value="4" title="完成" />
                  </v-stepper-header>

                  <v-stepper-window>
                    <!-- 步骤 1: 创建超级管理员 -->
                    <v-stepper-window-item :value="1">
                      <v-card-text>
                        <h3 class="mb-4">创建超级管理员账户</h3>
                        <v-form ref="adminForm">
                          <v-text-field
                            v-model="adminData.username"
                            label="用户名"
                            prepend-icon="mdi-account"
                            :rules="[rules.required, rules.minLength(3)]"
                            required
                          />
                          <v-text-field
                            v-model="adminData.password"
                            label="密码"
                            prepend-icon="mdi-lock"
                            type="password"
                            :rules="[rules.required, rules.minLength(8)]"
                            required
                          />
                          <v-text-field
                            v-model="adminData.confirmPassword"
                            label="确认密码"
                            prepend-icon="mdi-lock-check"
                            type="password"
                            :rules="[rules.required, rules.passwordMatch]"
                            required
                          />
                        </v-form>
                      </v-card-text>
                    </v-stepper-window-item>

                    <!-- 步骤 2: 配置爱发电 -->
                    <v-stepper-window-item :value="2">
                      <v-card-text>
                        <h3 class="mb-4">配置爱发电支付</h3>
                        <v-alert type="info" class="mb-4">
                          请在爱发电开发者后台获取您的 User ID 和 API Token
                        </v-alert>
                        <v-form ref="afdianForm">
                          <v-text-field
                            v-model="afdianData.userId"
                            label="爱发电 User ID"
                            prepend-icon="mdi-identifier"
                            :rules="[rules.required]"
                            required
                          />
                          <v-text-field
                            v-model="afdianData.token"
                            label="爱发电 API Token"
                            prepend-icon="mdi-key"
                            type="password"
                            :rules="[rules.required]"
                            required
                          />
                        </v-form>
                        <v-alert v-if="webhookUrl" type="success" class="mt-4">
                          <strong>Webhook URL:</strong><br />
                          {{ webhookUrl }}<br />
                          <small>请将此 URL 配置到爱发电开发者后台</small>
                        </v-alert>
                      </v-card-text>
                    </v-stepper-window-item>

                    <!-- 步骤 3: 创建第一个产品 -->
                    <v-stepper-window-item :value="3">
                      <v-card-text>
                        <h3 class="mb-4">创建第一个产品</h3>
                        <v-form ref="productForm">
                          <v-text-field
                            v-model="productData.name"
                            label="产品名称"
                            prepend-icon="mdi-package-variant"
                            :rules="[rules.required]"
                            required
                          />
                          <v-textarea
                            v-model="productData.description"
                            label="产品描述"
                            prepend-icon="mdi-text"
                            rows="3"
                          />
                        </v-form>
                      </v-card-text>
                    </v-stepper-window-item>

                    <!-- 步骤 4: 完成 -->
                    <v-stepper-window-item :value="4">
                      <v-card-text>
                        <v-alert type="success" class="mb-4">
                          <v-icon>mdi-check-circle</v-icon>
                          系统初始化完成！
                        </v-alert>

                        <h3 class="mb-2">RSA 公钥</h3>
                        <v-alert type="info">
                          <pre style="white-space: pre-wrap; word-break: break-all;">{{ publicKey }}</pre>
                        </v-alert>

                        <p class="mt-4">
                          请将上述公钥复制到您的客户端应用代码中，用于验证许可证签名。
                        </p>
                      </v-card-text>
                    </v-stepper-window-item>
                  </v-stepper-window>

                  <v-card-actions>
                    <v-btn v-if="step > 1 && step < 4" @click="step--">
                      上一步
                    </v-btn>
                    <v-spacer />
                    <v-btn
                      v-if="step < 4"
                      color="primary"
                      :loading="loading"
                      @click="nextStep"
                    >
                      {{ step === 3 ? '完成' : '下一步' }}
                    </v-btn>
                    <v-btn v-else color="primary" @click="goToLogin">
                      前往登录
                    </v-btn>
                  </v-card-actions>
                </v-stepper>
              </v-card-text>
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
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const router = useRouter()

const step = ref(1)
const loading = ref(false)

const adminData = ref({
  username: '',
  password: '',
  confirmPassword: '',
})

const afdianData = ref({
  userId: '',
  token: '',
})

const productData = ref({
  name: '',
  description: '',
})

const webhookUrl = ref('')
const publicKey = ref('')

const rules = {
  required: (v: string) => !!v || '此字段为必填项',
  minLength: (min: number) => (v: string) => v.length >= min || `至少需要 ${min} 个字符`,
  passwordMatch: (v: string) => v === adminData.value.password || '两次密码输入不一致',
}

const nextStep = async () => {
  loading.value = true
  try {
    if (step.value === 1) {
      // 创建超级管理员
      await axios.post(`${API_URL}/api/oobe/create-super-admin`, {
        username: adminData.value.username,
        password: adminData.value.password,
      })
      step.value++
    } else if (step.value === 2) {
      // 配置爱发电
      const response = await axios.post(`${API_URL}/api/oobe/configure-afdian`, {
        userId: afdianData.value.userId,
        token: afdianData.value.token,
      })
      webhookUrl.value = response.data.webhookUrl
      step.value++
    } else if (step.value === 3) {
      // 创建第一个产品
      const response = await axios.post(`${API_URL}/api/oobe/create-first-product`, {
        name: productData.value.name,
        description: productData.value.description,
      })
      publicKey.value = response.data.keyPair.publicKey

      // 完成 OOBE
      await axios.post(`${API_URL}/api/oobe/complete`)
      localStorage.setItem('oobe_completed', 'true')
      step.value++
    }
  } catch (error: any) {
    alert('错误: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>
