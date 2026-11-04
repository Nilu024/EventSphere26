import api from './api';
import { unwrap, toList } from './adapters';

export const notificationService = {
  list: () => api.get('/notifications').then((r) => toList(unwrap(r), ['notifications'])),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then(unwrap),
  markAllRead: () => api.patch('/notifications/read-all').then(unwrap),
};
