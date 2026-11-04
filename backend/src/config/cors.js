import { env } from './env.js';

/** Origin check shared by Express CORS and Socket.IO. Requests without Origin (curl, server-to-server) are allowed. */
export function isOriginAllowed(origin) {
  if (!origin) return true;
  return env.CLIENT_URLS.includes(origin);
}

export const corsOptions = {
  origin(origin, cb) {
    if (isOriginAllowed(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
