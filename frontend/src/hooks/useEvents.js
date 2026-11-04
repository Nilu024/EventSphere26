import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';
import { sessionService } from '@/services/sessionService';
import { speakerService } from '@/services/speakerService';
import { registrationService } from '@/services/registrationService';
import { eventView, registrationView, sessionView, speakerView } from '@/utils/fields';
import { useApiMutation } from './useApiMutation';
import { useAuth } from './useAuth';

export const KEYS = {
  events: ['events'], event: (id) => ['events', id], sessions: (id) => ['sessions', id], speakers: (id) => ['speakers', id],
  myRegs: ['registrations', 'me'], eventRegs: (id) => ['registrations', 'event', id],
  attendance: (id) => ['attendance', id], myAttendance: (id) => ['attendance', 'me', id],
};

export const useEvents = (params, enabled = true) => useQuery({
  queryKey: [...KEYS.events, 'list', params], queryFn: () => eventService.list(params), placeholderData: keepPreviousData, enabled,
  select: (p) => ({ ...p, items: p.items.map(eventView) }),
});

/** Events the current user may manage (organizers: own events when the backend exposes the owner id). */
export function useManageableEvents(enabled = true) {
  const { user, role } = useAuth();
  const q = useEvents({ limit: 100 }, enabled);
  const items = (q.data?.items || []).filter((e) => role !== 'organizer' || !e.organizerId || String(e.organizerId) === String(user?.id));
  return { ...q, items };
}

export const useEvent = (id) => useQuery({ queryKey: KEYS.event(id), queryFn: () => eventService.get(id), enabled: Boolean(id), select: eventView });
export const useSessions = (id) => useQuery({ queryKey: KEYS.sessions(id), queryFn: () => eventService.listSessions(id), enabled: Boolean(id), select: (l) => l.map(sessionView) });
export const useSpeakers = (id) => useQuery({ queryKey: KEYS.speakers(id), queryFn: () => speakerService.list(id), enabled: Boolean(id), select: (l) => l.map(speakerView) });
export const useMyRegistrations = () => {
  const { isAuthenticated, role } = useAuth();
  return useQuery({ queryKey: KEYS.myRegs, queryFn: registrationService.mine, enabled: isAuthenticated && role === 'participant', select: (l) => l.map(registrationView) });
};
export const useEventRegistrations = (id, params) => useQuery({
  queryKey: [...KEYS.eventRegs(id), params], queryFn: () => registrationService.forEvent(id, params), enabled: Boolean(id), placeholderData: keepPreviousData,
  select: (p) => ({ ...p, items: p.items.map(registrationView) }),
});
export const useAttendanceList = (id) => useQuery({ queryKey: KEYS.attendance(id), queryFn: () => registrationService.attendanceList(id), enabled: Boolean(id) });
export const useMyAttendance = (id, enabled = true) => useQuery({ queryKey: KEYS.myAttendance(id), queryFn: () => registrationService.myAttendance(id), enabled: Boolean(id) && enabled });

export const useRegister = () => useApiMutation(registrationService.register, { success: 'You are registered!', invalidate: [KEYS.myRegs, KEYS.events] });
export const useCancelRegistration = () => useApiMutation(registrationService.cancel, { success: 'Registration cancelled', invalidate: [KEYS.myRegs, KEYS.events] });
export const useCheckIn = () => useApiMutation(registrationService.checkIn, { success: 'Checked in', invalidate: [['attendance']] });
export const useCheckOut = () => useApiMutation(registrationService.checkOut, { success: 'Checked out', invalidate: [['attendance']] });
export const useMarkAttendance = (eventId) => useApiMutation((v) => registrationService.mark(eventId, v), { success: 'Attendance recorded', invalidate: [KEYS.attendance(eventId)] });

export const useEventMutations = () => ({
  create: useApiMutation(eventService.create, { success: 'Event created', invalidate: [KEYS.events] }),
  update: useApiMutation(({ id, values }) => eventService.update(id, values), { success: 'Event updated', invalidate: [KEYS.events] }),
  remove: useApiMutation(eventService.remove, { success: 'Event deleted', invalidate: [KEYS.events] }),
  publish: useApiMutation(eventService.publish, { success: 'Event published', invalidate: [KEYS.events] }),
  cancel: useApiMutation(eventService.cancel, { success: 'Event cancelled', invalidate: [KEYS.events] }),
  complete: useApiMutation(eventService.complete, { success: 'Event marked complete', invalidate: [KEYS.events] }),
  banner: useApiMutation(({ id, file }) => eventService.uploadBanner(id, file), { success: 'Banner uploaded', invalidate: [KEYS.events] }),
});
export const useSessionMutations = (eventId) => ({
  create: useApiMutation((v) => sessionService.create(eventId, v), { success: 'Session added', invalidate: [KEYS.sessions(eventId)] }),
  update: useApiMutation(({ id, values }) => sessionService.update(id, values), { success: 'Session updated', invalidate: [KEYS.sessions(eventId)] }),
  remove: useApiMutation(sessionService.remove, { success: 'Session deleted', invalidate: [KEYS.sessions(eventId)] }),
});
export const useSpeakerMutations = (eventId) => ({
  create: useApiMutation((v) => speakerService.create(eventId, v), { success: 'Speaker added', invalidate: [KEYS.speakers(eventId)] }),
  update: useApiMutation(({ id, values }) => speakerService.update(id, values), { success: 'Speaker updated', invalidate: [KEYS.speakers(eventId)] }),
  remove: useApiMutation(speakerService.remove, { success: 'Speaker removed', invalidate: [KEYS.speakers(eventId)] }),
  image: useApiMutation(({ id, file }) => speakerService.uploadImage(id, file), { success: 'Image uploaded', invalidate: [KEYS.speakers(eventId)] }),
});
