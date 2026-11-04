import api from './api';
import { unwrap, toEntity, toPage, toList, cleanParams } from './adapters';
import { eventBody, toFormData, UPLOAD_FIELDS } from './payloads';

export const eventService = {
  list: (params) => api.get('/events', { params: cleanParams(params) }).then((r) => toPage(r, ['events'])),
  get: (id) => api.get(`/events/${id}`).then((r) => toEntity(unwrap(r), ['event'])),
  create: (v) => api.post('/events', eventBody(v)).then((r) => toEntity(unwrap(r), ['event'])),
  update: (id, v) => api.patch(`/events/${id}`, eventBody(v)).then((r) => toEntity(unwrap(r), ['event'])),
  remove: (id) => api.delete(`/events/${id}`).then(unwrap),
  publish: (id) => api.patch(`/events/${id}/publish`).then(unwrap),
  cancel: (id) => api.patch(`/events/${id}/cancel`).then(unwrap),
  complete: (id) => api.patch(`/events/${id}/complete`).then(unwrap),
  uploadBanner: (id, file) => api.post(`/events/${id}/banner`, toFormData(UPLOAD_FIELDS.banner, file), { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap),
  listSessions: (eventId) => api.get(`/events/${eventId}/sessions`).then((r) => toList(unwrap(r), ['sessions'])),
};
