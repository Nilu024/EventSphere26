import api from './api';
import { unwrap, toList, toPage, cleanParams } from './adapters';
import { attendanceMarkBody } from './payloads';

export const registrationService = {
  register: (eventId) => api.post(`/events/${eventId}/register`).then(unwrap),
  cancel: (eventId) => api.delete(`/events/${eventId}/register`).then(unwrap),
  mine: () => api.get('/registrations/me').then((r) => toList(unwrap(r), ['registrations'])),
  forEvent: (eventId, params) => api.get(`/events/${eventId}/registrations`, { params: cleanParams(params) }).then((r) => toPage(r, ['registrations'])),
  checkIn: (eventId) => api.post(`/events/${eventId}/attendance/check-in`).then(unwrap),
  checkOut: (eventId) => api.post(`/events/${eventId}/attendance/check-out`).then(unwrap),
  myAttendance: (eventId) => api.get(`/events/${eventId}/attendance/me`).then(unwrap),
  mark: (eventId, v) => api.post(`/events/${eventId}/attendance/mark`, attendanceMarkBody(v)).then(unwrap),
  attendanceList: (eventId) => api.get(`/events/${eventId}/attendance`).then((r) => toList(unwrap(r), ['attendance', 'attendances', 'records'])),
};
