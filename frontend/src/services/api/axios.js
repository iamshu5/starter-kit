import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let pendingQueue = []

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  pendingQueue = []
}

function redirectToLogin() {
  useAuthStore.getState().clearAuth()
  window.location.href = '/login'
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const path = window.location.pathname

    if (status === 403) {
      error.message = error.response?.data?.message || 'Anda tidak memiliki akses untuk melakukan action ini!'
      return Promise.reject(error)
    }

    if (status === 401) {
      const isAuthPage = path.startsWith('/login') || path.startsWith('/register')
      const isRefreshCall = original.url?.includes('/auth/refresh')

      if (original._retry || isAuthPage || isRefreshCall) {
        if (!isAuthPage) redirectToLogin()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          original._retry = true
          return api(original)
        }).catch((err) => Promise.reject(err))
      }

      original._retry = true
      isRefreshing = true
      try {
        const { data } = await api.post('/auth/refresh')
        const newToken = data.data.token
        useAuthStore.getState().setToken(newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        redirectToLogin()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
