import api from '@/services/api/axios'

export const rolesApi = {
  list: (params) => api.get('/roles', { params }),
  get: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  remove: (id) => api.delete(`/roles/${id}`),
  permissions: () => api.get('/permissions'),
  syncPermissions: (id, data) => api.post(`/roles/${id}/permissions`, data),
  syncMenus: (id, data) => api.post(`/roles/${id}/menus`, data),
}
