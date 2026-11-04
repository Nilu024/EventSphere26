import api from './api';
import { unwrap } from './adapters';
import { sessionBody } from './payloads';

export const sessionService = {
  create: (eventId, v) => api.post(`/events/${eventId}/sessions`, sessionBody(v)).then(unwrap),
  update: (id, v) => api.patch(`/sessions/${id}`, sessionBody(v)).then(unwrap),
  remove: (id) => api.delete(`/sessions/${id}`).then(unwrap),
};
