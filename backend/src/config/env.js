import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

const str = (name, def = '') => (process.env[name] !== undefined && process.env[name] !== '' ? process.env[name] : def);
const num = (name, def) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return def;
  const n = Number(raw);
  if (Number.isNaN(n)) throw new Error(`Environment variable ${name} must be a number`);
  return n;
};
const bool = (name, def) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return def;
  return ['1', 'true', 'yes', 'on'].includes(String(raw).toLowerCase());
};

// Test runs get safe defaults so the suite works with nothing but a local MongoDB.
if (isTest) {
  process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-123456';
  process.env.CLIENT_URL ||= 'http://localhost:5173';
  process.env.MONGODB_URI_TEST ||= 'mongodb://127.0.0.1:27017/eventsphere_test';
}

const required = ['JWT_SECRET', 'CLIENT_URL', isTest ? 'MONGODB_URI_TEST' : 'MONGODB_URI'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}. See .env.example`);
}
if (isProd && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

export const env = Object.freeze({
  NODE_ENV,
  isProd,
  isTest,
  PORT: num('PORT', 5000),
  TRUST_PROXY: num('TRUST_PROXY', 0),
  MONGODB_URI: isTest ? process.env.MONGODB_URI_TEST : process.env.MONGODB_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: str('JWT_EXPIRES_IN', '15m'),
  BCRYPT_ROUNDS: num('BCRYPT_ROUNDS', isTest ? 4 : 12),
  COOKIE_SAMESITE: str('COOKIE_SAMESITE', 'lax'),
  COOKIE_NAME: 'eventsphere_token',
  PASSWORD_RESET_EXPIRES_MINUTES: num('PASSWORD_RESET_EXPIRES_MINUTES', 30),

  CLIENT_URLS: str('CLIENT_URL').split(',').map((s) => s.trim()).filter(Boolean),

  CLOUDINARY_CLOUD_NAME: str('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: str('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: str('CLOUDINARY_API_SECRET'),

  EMAIL_HOST: str('EMAIL_HOST'),
  EMAIL_PORT: num('EMAIL_PORT', 587),
  EMAIL_USER: str('EMAIL_USER'),
  EMAIL_PASSWORD: str('EMAIL_PASSWORD'),
  EMAIL_FROM: str('EMAIL_FROM', 'EventSphere <no-reply@eventsphere.local>'),

  NETWORKING_DURATION_SECONDS: num('NETWORKING_DURATION_SECONDS', 120),
  NETWORKING_START_DELAY_SECONDS: num('NETWORKING_START_DELAY_SECONDS', 5),
  NETWORKING_QUEUE_TTL_SECONDS: num('NETWORKING_QUEUE_TTL_SECONDS', 300),
  NETWORKING_DISCONNECT_GRACE_SECONDS: num('NETWORKING_DISCONNECT_GRACE_SECONDS', isTest ? 0.2 : 5),
  ENFORCE_EVENT_TIME_WINDOW: bool('ENFORCE_EVENT_TIME_WINDOW', true),
  ATTENDANCE_EARLY_MINUTES: num('ATTENDANCE_EARLY_MINUTES', 30),

  JITSI_DOMAIN: str('JITSI_DOMAIN', 'meet.jit.si'),
  JITSI_APP_ID: str('JITSI_APP_ID'),
  JITSI_APP_SECRET: str('JITSI_APP_SECRET'),
  JITSI_PRIVATE_KEY: str('JITSI_PRIVATE_KEY').replace(/\\n/g, '\n'),
  JITSI_KEY_ID: str('JITSI_KEY_ID'),

  RATE_LIMIT_WINDOW_MINUTES: num('RATE_LIMIT_WINDOW_MINUTES', 15),
  RATE_LIMIT_MAX: num('RATE_LIMIT_MAX', 300),
  AUTH_RATE_LIMIT_MAX: num('AUTH_RATE_LIMIT_MAX', 20),
  LOG_LEVEL: str('LOG_LEVEL', 'info'),
  ENABLE_SWAGGER: bool('ENABLE_SWAGGER', !isProd),
});
