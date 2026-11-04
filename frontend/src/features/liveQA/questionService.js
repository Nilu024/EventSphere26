import api from '@/services/api';
import { unwrap, toList } from '@/services/adapters';
import { questionBody, moderateBody } from '@/services/payloads';

export const questionService = {
  list: (eventId) => api.get(`/events/${eventId}/questions`).then((r) => toList(unwrap(r), ['questions'])),
  ask: (eventId, v) => api.post(`/events/${eventId}/questions`, questionBody(v)).then(unwrap),
  upvote: (id) => api.post(`/questions/${id}/upvote`).then(unwrap),
  removeUpvote: (id) => api.delete(`/questions/${id}/upvote`).then(unwrap),
  moderate: (id, status) => api.patch(`/questions/${id}/moderate`, moderateBody(status)).then(unwrap),
};
