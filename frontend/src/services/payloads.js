/**
 * Request-body builders. The API documentation lists endpoints but not request bodies, so every
 * body shape is an ASSUMPTION concentrated in this file (see README → "Backend assumptions").
 * If the backend expects different field names, change them here only.
 */
import { toISO } from '@/utils/formatDate';

const csv = (s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);
const strip = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ''));

export const registerBody = ({ name, email, password, role }) => ({ name, email, password, role });
export const loginBody = ({ email, password }) => ({ email, password });
export const forgotBody = ({ email }) => ({ email });
export const resetBody = ({ token, password }) => ({ token, password });
export const changePasswordBody = ({ currentPassword, newPassword }) => ({ currentPassword, newPassword });

export const profileBody = (v) => strip({ name: v.name, headline: v.headline, company: v.company, location: v.location, bio: v.bio, skills: csv(v.skills), interests: csv(v.interests) });

export const eventBody = (v) => strip({
  title: v.title, description: v.description, startDate: toISO(v.startDate), endDate: toISO(v.endDate),
  category: v.category, location: v.location, capacity: v.capacity ? Number(v.capacity) : undefined,
});
export const sessionBody = (v) => strip({ title: v.title, description: v.description, startTime: toISO(v.startTime), endTime: toISO(v.endTime) });
export const speakerBody = (v) => strip({ name: v.name, designation: v.designation, company: v.company, bio: v.bio });

export const statusBody = (status) => ({ status });
export const roleBody = (role) => ({ role });
export const moderateBody = (status) => ({ status });
export const questionBody = ({ content }) => ({ content });
export const messageBody = (receiverId, content) => ({ receiverId, content });
export const queueJoinBody = (eventId) => (eventId ? { eventId } : {});
export const attendanceMarkBody = ({ userId, status = 'present' }) => ({ userId, status });

/** Multipart field names for Cloudinary-backed upload endpoints (ASSUMPTION). */
export const UPLOAD_FIELDS = { avatar: 'avatar', banner: 'banner', speaker: 'image' };
export const toFormData = (field, file) => { const fd = new FormData(); fd.append(field, file); return fd; };
