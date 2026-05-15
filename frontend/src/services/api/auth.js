import api from '@/services/api/axios'

export const authApi = {
  login:         (data) => api.post('/auth/login', data),
  register:      (data) => api.post('/auth/register', data),
  logout:        ()     => api.post('/auth/logout'),
  me:            ()     => api.get('/auth/me'),
  refresh:       ()     => api.post('/auth/refresh'),
  updateProfile: (data) => api.patch('/auth/profile', data),
}
