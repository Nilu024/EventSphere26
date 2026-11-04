import api from './api';
import { unwrap, toEntity, toPage, cleanParams } from './adapters';
import { profileBody, statusBody, roleBody, toFormData, UPLOAD_FIELDS } from './payloads';

export const userService = {
  getMe: () => api.get('/users/me').then((r) => toEntity(unwrap(r), ['user'])),
  updateMe: (v) => api.patch('/users/me', profileBody(v)).then((r) => toEntity(unwrap(r), ['user'])),
  uploadAvatar: (file) => api.post('/users/me/avatar', toFormData(UPLOAD_FIELDS.avatar, file), { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap),
  list: (params) => api.get('/users', { params: cleanParams(params) }).then((r) => toPage(r, ['users'])),
  get: (id) => api.get(`/users/${id}`).then((r) => toEntity(unwrap(r), ['user'])),
  updateStatus: (id, status) => api.patch(`/users/${id}/status`, statusBody(status)).then(unwrap),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, roleBody(role)).then(unwrap),
};
