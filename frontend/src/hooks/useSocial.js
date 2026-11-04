import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { connectionService } from '@/features/connectionHub/connectionService';
import { matchService } from '@/features/matchmaker/matchService';
import { messageService } from '@/services/messageService';
import { questionService } from '@/features/liveQA/questionService';
import { networkingService } from '@/features/speedNetworking/networkingService';
import { analyticsService } from '@/features/analytics/analyticsService';
import { userService } from '@/services/userService';
import { connectionView, matchView, messageView, questionView, userView, netSessionView } from '@/utils/fields';
import { useApiMutation } from './useApiMutation';
import { useAuth } from './useAuth';
import { useSocketEvent } from './useSocket';
import { SOCKET_EVENTS } from '@/services/socketEvents';

export const SK = {
  recs: ['recommendations'], connections: ['connections'], requests: ['connections', 'requests'], blocked: ['connections', 'blocked'],
  messages: (id) => ['messages', id], questions: (id) => ['questions', id], active: ['networking', 'active'], history: ['networking', 'history'],
  platform: ['analytics', 'platform'], eventAnalytics: (id) => ['analytics', 'event', id], users: ['users'], me: ['users', 'me'],
};

export const useRecommendations = (params) => useQuery({ queryKey: [...SK.recs, params], queryFn: () => matchService.recommendations(params), select: (l) => l.map(matchView) });

export function useConnections() {
  const { user } = useAuth();
  return useQuery({ queryKey: SK.connections, queryFn: connectionService.list, select: (l) => l.map((c) => connectionView(c, user?.id)).filter((c) => !['pending', 'rejected', 'cancelled'].includes(c.status)) });
}

/** Normalises either a flat list or { incoming, outgoing } into two arrays. */
export function useConnectionRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: SK.requests, queryFn: connectionService.requests, refetchInterval: 30000,
    select: (p) => {
      const inc = p?.incoming ?? p?.received; const out = p?.outgoing ?? p?.sent;
      if (Array.isArray(inc) || Array.isArray(out)) {
        return { incoming: (inc || []).map((c) => ({ ...connectionView(c, user?.id), outgoing: false })), outgoing: (out || []).map((c) => ({ ...connectionView(c, user?.id), outgoing: true })) };
      }
      const list = (Array.isArray(p) ? p : p?.requests || p?.data || []).map((c) => connectionView(c, user?.id)).filter((c) => c.status === 'pending');
      return { incoming: list.filter((c) => !c.outgoing), outgoing: list.filter((c) => c.outgoing) };
    },
  });
}
export const useBlocked = () => useQuery({ queryKey: SK.blocked, queryFn: connectionService.blocked, select: (l) => l.map((b) => userView(b.user || b.blockedUser || b)) });

export function useConnectionMutations() {
  const inv = [SK.connections, SK.requests, SK.recs, SK.blocked];
  return {
    send: useApiMutation(({ userId, message }) => connectionService.send(userId, message), { success: 'Connection request sent', invalidate: inv }),
    accept: useApiMutation(connectionService.accept, { success: 'Connection accepted', invalidate: inv }),
    reject: useApiMutation(connectionService.reject, { success: 'Request declined', invalidate: inv }),
    cancel: useApiMutation(connectionService.cancel, { success: 'Request cancelled', invalidate: inv }),
    remove: useApiMutation(connectionService.remove, { success: 'Connection removed', invalidate: inv }),
    block: useApiMutation(connectionService.block, { success: 'User blocked', invalidate: inv }),
    unblock: useApiMutation(connectionService.unblock, { success: 'User unblocked', invalidate: inv }),
  };
}

export function useConversation(userId) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ['messages'] }), [qc]);
  useSocketEvent(SOCKET_EVENTS.message, refresh);
  return useQuery({ queryKey: SK.messages(userId), queryFn: () => messageService.conversation(userId), enabled: Boolean(userId), refetchInterval: 5000, select: (l) => l.map((m) => messageView(m, user?.id)) });
}
export const useSendMessage = (userId) => useApiMutation((content) => messageService.send(userId, content), { invalidate: [['messages']] });

export function useQuestions(eventId) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: SK.questions(eventId) }), [qc, eventId]);
  useSocketEvent(SOCKET_EVENTS.questionUpdate, refresh);
  return useQuery({ queryKey: SK.questions(eventId), queryFn: () => questionService.list(eventId), enabled: Boolean(eventId), refetchInterval: 6000, select: (l) => l.map((q) => questionView(q, user?.id)) });
}
export function useQuestionMutations(eventId) {
  const k = [SK.questions(eventId)];
  return {
    ask: useApiMutation((v) => questionService.ask(eventId, v), { success: 'Question submitted', invalidate: k }),
    upvote: useApiMutation(questionService.upvote, { invalidate: k }),
    removeUpvote: useApiMutation(questionService.removeUpvote, { invalidate: k }),
    moderate: useApiMutation(({ id, status }) => questionService.moderate(id, status), { success: 'Question updated', invalidate: k }),
  };
}

export function useActiveNetSession(enabled = true, interval = 4000) {
  const qc = useQueryClient();
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: SK.active }), [qc]);
  useSocketEvent(SOCKET_EVENTS.queueMatched, refresh);
  useSocketEvent(SOCKET_EVENTS.sessionEnded, refresh);
  return useQuery({ queryKey: SK.active, queryFn: networkingService.active, enabled, refetchInterval: interval, select: netSessionView });
}
export const useNetHistory = () => useQuery({ queryKey: SK.history, queryFn: networkingService.history, select: (l) => l.map(netSessionView) });
export function useNetMutations() {
  return {
    join: useApiMutation(networkingService.join, { success: 'You joined the queue', invalidate: [SK.active] }),
    leave: useApiMutation(networkingService.leave, { success: 'You left the queue', invalidate: [SK.active] }),
    end: useApiMutation(networkingService.end, { success: 'Meeting ended', invalidate: [SK.active, SK.history] }),
  };
}

export const usePlatformAnalytics = () => useQuery({ queryKey: SK.platform, queryFn: analyticsService.platform });
export const useEventAnalytics = (id) => useQuery({ queryKey: SK.eventAnalytics(id), queryFn: () => analyticsService.event(id), enabled: Boolean(id) });

export const useUsers = (params) => useQuery({ queryKey: [...SK.users, 'list', params], queryFn: () => userService.list(params), select: (p) => ({ ...p, items: p.items.map(userView) }) });
export const useUser = (id) => useQuery({ queryKey: [...SK.users, id], queryFn: () => userService.get(id), enabled: Boolean(id), select: userView });
export function useUserMutations() {
  return {
    status: useApiMutation(({ id, status }) => userService.updateStatus(id, status), { success: 'User status updated', invalidate: [SK.users] }),
    role: useApiMutation(({ id, role }) => userService.updateRole(id, role), { success: 'User role updated', invalidate: [SK.users] }),
  };
}
