<template>
  <v-app>
    <!-- 导航抽屉 -->
    <v-navigation-drawer v-model="drawer" app>
      <v-list>
        <v-list-item
          prepend-icon="mdi-account-circle"
          :title="authStore.user?.username || '用户'"
          subtitle="管理员"
        />
      </v-list>

      <v-divider />

      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="仪表盘"
          value="dashboard"
          to="/"
        />
        <v-list-item
          prepend-icon="mdi-certificate"
          title="许可证管理"
          value="licenses"
          to="/licenses"
        />
        <v-list-item
          prepend-icon="mdi-package-variant"
          title="产品管理"
          value="products"
          to="/products"
        />
        <v-list-item
          prepend-icon="mdi-account-group"
          title="用户管理"
          value="users"
          to="/users"
        />
        <v-list-item
          prepend-icon="mdi-shield-account"
          title="管理员"
          value="admins"
          to="/admins"
        />
        <v-list-item
          prepend-icon="mdi-cog"
          title="系统设置"
          value="settings"
          to="/settings"
        />
        <v-list-item
          prepend-icon="mdi-text-box"
          title="操作日志"
          value="logs"
          to="/logs"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- 应用栏 -->
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>VelaOS License Manager</v-toolbar-title>
      <v-spacer />
      <v-btn icon @click="handleLogout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- 主内容区 -->
    <v-main>
      <v-container fluid>
        <router-view />
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

const drawer = ref(true)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
