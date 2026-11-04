import axios from 'axios';
import { API_BASE_URL } from '@/utils/constants';

/**
 * Central Axios instance.
 * AUTH: the documentation specifies JWT in HttpOnly cookies, so requests are sent with
 * `withCredentials`. No token is ever read or stored by JavaScript. If the backend turns out to
 * use Bearer tokens instead, this file is the single place to change.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

const SILENT_401 = ['/auth/login', '/auth/register', '/auth/me', '/auth/forgot-password', '/auth/reset-password', '/auth/change-password'];

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (status === 401 && !SILENT_401.some((p) => url.includes(p))) onUnauthorized?.();
    return Promise.reject(error);
  },
);

export default api;
