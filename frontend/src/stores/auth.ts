import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<any>(null)

  const login = async (username: string, password: string) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      username,
      password,
    })

    token.value = response.data.accessToken
    user.value = response.data.user
    localStorage.setItem('token', response.data.accessToken)

    // 配置 axios 默认 header
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`

    return response.data
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  const fetchProfile = async () => {
    if (!token.value) return

    try {
      const response = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
      user.value = response.data
    } catch (error) {
      logout()
    }
  }

  // 初始化时设置 token
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    fetchProfile()
  }

  return {
    token,
    user,
    login,
    logout,
    fetchProfile,
  }
})
