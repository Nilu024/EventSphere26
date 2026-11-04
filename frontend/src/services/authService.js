import api from './api';
import { unwrap, toEntity } from './adapters';
import { registerBody, loginBody, forgotBody, resetBody, changePasswordBody } from './payloads';

export const authService = {
  register: (v) => api.post('/auth/register', registerBody(v)).then(unwrap),
  login: (v) => api.post('/auth/login', loginBody(v)).then(unwrap),
  logout: () => api.post('/auth/logout').then(unwrap),
  me: () => api.get('/auth/me').then((r) => toEntity(unwrap(r), ['user'])),
  changePassword: (v) => api.patch('/auth/change-password', changePasswordBody(v)).then(unwrap),
  forgotPassword: (v) => api.post('/auth/forgot-password', forgotBody(v)).then(unwrap),
  resetPassword: (v) => api.post('/auth/reset-password', resetBody(v)).then(unwrap),
};
