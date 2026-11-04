import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { setUnauthorizedHandler } from '@/services/api';
import { userView } from '@/utils/fields';

export const AuthContext = createContext(null);

/** Auth state. The session lives in an HttpOnly cookie, so the only source of truth is GET /auth/me. */
export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.me();
      const u = me ? userView(me) : null;
      setUser(u?.id ? u : null);
      return u;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  useEffect(() => {
    setUnauthorizedHandler(() => { setUser(null); qc.clear(); });
    return () => setUnauthorizedHandler(null);
  }, [qc]);

  const login = useCallback(async (values) => { await authService.login(values); return refreshUser(); }, [refreshUser]);

  /** Returns the user if the backend signed them in on registration, otherwise null. */
  const register = useCallback(async (values) => { await authService.register(values); return refreshUser(); }, [refreshUser]);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* cookie may already be gone */ }
    setUser(null); qc.clear();
  }, [qc]);

  const value = useMemo(() => ({
    user, loading, isAuthenticated: Boolean(user), role: user?.role?.toLowerCase(), login, register, logout, refreshUser, setUser,
  }), [user, loading, login, register, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
