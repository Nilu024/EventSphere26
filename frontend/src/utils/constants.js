export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
export const JITSI_DOMAIN = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si';

export const ROLES = { ADMIN: 'admin', ORGANIZER: 'organizer', PARTICIPANT: 'participant' };
/** Public registration is limited to these roles (admin accounts are never self-service). */
export const PUBLIC_ROLES = [ROLES.PARTICIPANT, ROLES.ORGANIZER];

/** ASSUMPTION (undocumented): fallback speed-networking meeting length when the backend sends no end time. */
export const DEFAULT_MEETING_SECONDS = 5 * 60;
export const PAGE_SIZE = 12;
