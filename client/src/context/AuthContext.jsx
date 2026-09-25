import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [session, setSession] = useState({ idleMinutes: 30 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me').then((d) => { setUser(d.user); if (d.session) setSession(d.session); }).catch(() => setToken(null)).finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const onExpired = () => { setUser(null); setExpired(true); };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const signIn = useCallback((token, u, s) => { setToken(token); setUser(u); setExpired(false); if (s) setSession(s); }, []);

  const login = useCallback(async (email, password) => {
    const d = await api.post('/auth/login', { email, password });
    signIn(d.token, d.user, d.session);
    return d.user;
  }, [signIn]);

  /** Ends the session on the server too, so the token can never be reused. */
  const logout = useCallback((reason) => {
    if (getToken()) api.post('/auth/logout').catch(() => {});
    setToken(null);
    setUser(null);
    setExpired(reason === 'expired');
  }, []);

  const value = useMemo(() => ({ user, setUser, checking, login, logout, signIn, session, expired, isAdmin: user?.role === 'admin' }), [user, checking, login, logout, signIn, session, expired]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
