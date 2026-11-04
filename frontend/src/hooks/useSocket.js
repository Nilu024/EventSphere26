import { useContext, useEffect, useRef } from 'react';
import { SocketContext } from '@/context/SocketContext';

export const useSocket = () => useContext(SocketContext);

/** Subscribe to a socket event with guaranteed cleanup. A null/undefined name disables it. */
export function useSocketEvent(eventName, handler) {
  const { socket } = useSocket();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!socket || !eventName) return undefined;
    const fn = (...args) => ref.current?.(...args);
    socket.on(eventName, fn);
    return () => { socket.off(eventName, fn); };
  }, [socket, eventName]);
}
