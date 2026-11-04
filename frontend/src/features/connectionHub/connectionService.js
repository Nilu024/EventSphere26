import api from '@/services/api';
import { unwrap, toList } from '@/services/adapters';

export const connectionService = {
  list: () => api.get('/connections').then((r) => toList(unwrap(r), ['connections'])),
  /** Returns the raw payload: may be a flat list or { incoming, outgoing } – split in the hook. */
  requests: () => api.get('/connections/requests').then(unwrap),
  send: (userId, message) => api.post(`/connections/request/${userId}`, message ? { message } : {}).then(unwrap),
  accept: (id) => api.patch(`/connections/${id}/accept`).then(unwrap),
  reject: (id) => api.patch(`/connections/${id}/reject`).then(unwrap),
  cancel: (id) => api.patch(`/connections/${id}/cancel`).then(unwrap),
  remove: (id) => api.delete(`/connections/${id}`).then(unwrap),
  block: (userId) => api.post(`/connections/block/${userId}`).then(unwrap),
  unblock: (userId) => api.delete(`/connections/block/${userId}`).then(unwrap),
  blocked: () => api.get('/connections/blocked').then((r) => toList(unwrap(r), ['blocked', 'blockedUsers', 'users'])),
};
