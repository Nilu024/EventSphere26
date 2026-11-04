import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

const toDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : typeof v === 'number' ? new Date(v) : parseISO(String(v));
  return isValid(d) ? d : null;
};
export const formatDate = (v, pattern = 'MMM d, yyyy') => { const d = toDate(v); return d ? format(d, pattern) : '—'; };
export const formatDateTime = (v) => formatDate(v, 'MMM d, yyyy · h:mm a');
export const formatTime = (v) => formatDate(v, 'h:mm a');
export const timeAgo = (v) => { const d = toDate(v); return d ? formatDistanceToNow(d, { addSuffix: true }) : ''; };
/** Value suitable for <input type="datetime-local"> */
export const toInputDateTime = (v) => { const d = toDate(v); return d ? format(d, "yyyy-MM-dd'T'HH:mm") : ''; };
export const toISO = (local) => { if (!local) return undefined; const d = new Date(local); return isValid(d) ? d.toISOString() : undefined; };
export const formatClock = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
