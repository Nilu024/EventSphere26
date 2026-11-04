import api from '@/services/api';
import { unwrap, toList, toEntity, cleanParams } from '@/services/adapters';

export const matchService = {
  recommendations: (params) => api.get('/networking/recommendations', { params: cleanParams(params) }).then((r) => toList(unwrap(r), ['recommendations', 'users', 'matches'])),
  forUser: (userId) => api.get(`/networking/recommendations/${userId}`).then((r) => toEntity(unwrap(r), ['recommendation', 'match', 'user'])),
};
