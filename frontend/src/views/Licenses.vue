<template>
  <div>
    <h1 class="text-h4 mb-6">许可证管理</h1>

    <v-card>
      <v-card-title>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="搜索设备ID或邮箱"
              single-line
              hide-details
            />
          </v-col>
          <v-col cols="12" md="6" class="text-right">
            <v-btn color="primary" prepend-icon="mdi-plus">
              创建许可证
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="licenses"
        :loading="loading"
        :search="search"
        class="elevation-1"
      >
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small">
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" color="error">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const search = ref('')
const loading = ref(false)
const licenses = ref([])

const headers = [
  { title: 'ID', key: 'id' },
  { title: '设备ID', key: 'user.deviceId' },
  { title: '产品', key: 'product.name' },
  { title: '类型', key: 'licenseType' },
  { title: '状态', key: 'status' },
  { title: '创建时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false },
]

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    pending: 'warning',
    expired: 'error',
    revoked: 'grey',
  }
  return colors[status] || 'grey'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: '已激活',
    pending: '待激活',
    expired: '已过期',
    revoked: '已吊销',
  }
  return texts[status] || status
}

onMounted(() => {
  // TODO: 从 API 获取许可证列表
  loading.value = true
  setTimeout(() => {
    licenses.value = []
    loading.value = false
  }, 500)
})
</script>
