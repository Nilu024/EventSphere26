import api from '@/services/api';
import { unwrap } from '@/services/adapters';

export const analyticsService = {
  event: (eventId) => api.get(`/analytics/events/${eventId}`).then(unwrap),
  platform: () => api.get('/analytics/platform').then(unwrap),
};
