import { createContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '@/utils/constants';
import { useAuth } from '@/hooks/useAuth';

export const SocketContext = createContext({ socket: null, connected: false });

/** One shared connection, opened only while authenticated and always closed on logout/unmount. */
export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const s = io(SOCKET_URL, { withCredentials: true, autoConnect: true, reconnectionAttempts: 8 });
    const up = () => setConnected(true);
    const down = () => setConnected(false);
    s.on('connect', up);
    s.on('disconnect', down);
    s.on('connect_error', down);
    // Dev aid: reveals real event names so they can be added to services/socketEvents.js.
    if (import.meta.env.DEV) s.onAny((name) => console.debug('[socket]', name));
    setSocket(s);
    return () => { s.off('connect', up); s.off('disconnect', down); s.off('connect_error', down); s.offAny(); s.disconnect(); setSocket(null); setConnected(false); };
  }, [isAuthenticated]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
