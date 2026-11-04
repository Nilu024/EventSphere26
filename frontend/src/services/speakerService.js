import api from './api';
import { unwrap, toList } from './adapters';
import { speakerBody, toFormData, UPLOAD_FIELDS } from './payloads';

export const speakerService = {
  list: (eventId) => api.get(`/events/${eventId}/speakers`).then((r) => toList(unwrap(r), ['speakers'])),
  create: (eventId, v) => api.post(`/events/${eventId}/speakers`, speakerBody(v)).then(unwrap),
  update: (id, v) => api.patch(`/speakers/${id}`, speakerBody(v)).then(unwrap),
  remove: (id) => api.delete(`/speakers/${id}`).then(unwrap),
  uploadImage: (id, file) => api.post(`/speakers/${id}/image`, toFormData(UPLOAD_FIELDS.speaker, file), { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap),
};
