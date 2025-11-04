<template>
  <div>
    <h1 class="text-h4 mb-6">仪表盘</h1>

    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">总许可证数</div>
            <div class="text-h4">{{ stats.totalLicenses }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">活跃许可证</div>
            <div class="text-h4">{{ stats.activeLicenses }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">总用户数</div>
            <div class="text-h4">{{ stats.totalUsers }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">产品数量</div>
            <div class="text-h4">{{ stats.totalProducts }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>欢迎使用 VelaOS License Manager</v-card-title>
          <v-card-text>
            <p>这是一个通用的小米 VelaOS 智能穿戴快应用后台验证管理系统。</p>
            <p class="mt-2">您可以通过左侧菜单访问各个功能模块。</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const stats = ref({
  totalLicenses: 0,
  activeLicenses: 0,
  totalUsers: 0,
  totalProducts: 0,
})

onMounted(() => {
  // TODO: 从 API 获取统计数据
  stats.value = {
    totalLicenses: 0,
    activeLicenses: 0,
    totalUsers: 0,
    totalProducts: 0,
  }
})
</script>
