import { createContext, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import { notificationView } from '@/utils/fields';
import { useAuth } from '@/hooks/useAuth';
import { useSocketEvent } from '@/hooks/useSocket';
import { SOCKET_EVENTS } from '@/services/socketEvents';

export const NotificationContext = createContext(null);
export const NOTIFICATIONS_KEY = ['notifications'];

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: notificationService.list,
    enabled: isAuthenticated,
    refetchInterval: 30000, // polling fallback until socket events are confirmed
    select: (list) => list.map(notificationView),
  });

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }), [qc]);
  useSocketEvent(SOCKET_EVENTS.notification, invalidate);

  const markRead = useMutation({ mutationFn: notificationService.markRead, onSuccess: invalidate });
  const markAll = useMutation({ mutationFn: notificationService.markAllRead, onSuccess: invalidate });

  const value = useMemo(() => {
    const items = query.data || [];
    return { items, unread: items.filter((n) => !n.read).length, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch, markRead, markAll };
  }, [query.data, query.isLoading, query.isError, query.refetch, markRead, markAll]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
