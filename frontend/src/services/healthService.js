import api from './api';
export const healthService = { check: () => api.get('/health').then((r) => r.data) };
