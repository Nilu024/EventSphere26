import api from '@/services/api';
import { unwrap, toList, toEntity } from '@/services/adapters';
import { queueJoinBody } from '@/services/payloads';

export const networkingService = {
  join: (eventId) => api.post('/networking/queue/join', queueJoinBody(eventId)).then(unwrap),
  leave: () => api.post('/networking/queue/leave').then(unwrap),
  /** "No active session" may be a 404 or an empty body – both mean `null`. */
  active: () => api.get('/networking/sessions/active')
    .then((r) => { const p = toEntity(unwrap(r), ['session']); return p && typeof p === 'object' && Object.keys(p).length ? p : null; })
    .catch((e) => { if (e.response?.status === 404) return null; throw e; }),
  history: () => api.get('/networking/sessions/history').then((r) => toList(unwrap(r), ['sessions', 'history'])),
  get: (id) => api.get(`/networking/sessions/${id}`).then((r) => toEntity(unwrap(r), ['session'])),
  end: (id) => api.post(`/networking/sessions/${id}/end`).then(unwrap),
};
