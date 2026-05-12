import api from '@/services/api/axios'

export const menusApi = {
  list: (params) => api.get('/menus', { params }),
  flat: () => api.get('/menus/flat'),
  sidebar: () => api.get('/menus/sidebar'),
  get: (id) => api.get(`/menus/${id}`),
  create: (data) => api.post('/menus', data),
  update: (id, data) => api.put(`/menus/${id}`, data),
  remove: (id) => api.delete(`/menus/${id}`),
}
