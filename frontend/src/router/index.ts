import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/oobe',
    name: 'OOBE',
    component: () => import('../views/OOBE.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('../layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
      },
      {
        path: 'licenses',
        name: 'Licenses',
        component: () => import('../views/Licenses.vue'),
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('../views/Products.vue'),
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/Users.vue'),
      },
      {
        path: 'admins',
        name: 'Admins',
        component: () => import('../views/Admins.vue'),
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('../views/Logs.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const oobeCompleted = localStorage.getItem('oobe_completed')

  // 如果 OOBE 未完成，重定向到 OOBE 页面
  if (oobeCompleted !== 'true' && to.path !== '/oobe') {
    next('/oobe')
    return
  }

  // 如果需要认证但没有 token，重定向到登录页
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }

  // 如果已登录但访问登录页，重定向到首页
  if (to.path === '/login' && token) {
    next('/')
    return
  }

  next()
})

export default router
