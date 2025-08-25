import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AuthContext } from '@/hooks/useAuth';
import { fetchToken } from '@/api/auth';

// Token expiration time (in seconds)
const TOKEN_EXPIRATION_SEC = (() => {
  const raw = import.meta.env.VITE_TOKEN_EXPIRATION_TIME as string | undefined;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
})();

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Décodage de la date d'expiration (exp) depuis le JWT */
  const getExp = (tok: string): number | undefined => {
    try {
      const payload = JSON.parse(atob(tok.split('.')[1]));
      return typeof payload.exp === 'number' ? payload.exp : undefined;
    } catch {
      return undefined;
    }
  };

  const scheduleRefresh = (tok: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const exp = getExp(tok);
    const nowSec = Date.now() / 1000;
    const targetSec = exp ? exp - 5 : TOKEN_EXPIRATION_SEC - 5;
    const delayMs = Math.max((targetSec - nowSec) * 1000, 1000);
    console.log(`[Auth] Next refresh in ${delayMs} ms`);
    timerRef.current = setTimeout(refreshToken, delayMs);
  };

  const refreshToken = () => {
    console.log('[Auth] Refreshing token...');
    fetchToken(true)
      .then((t) => {
        setToken(t);
        console.log('[Auth] Token refreshed');
        scheduleRefresh(t);
      })
      .catch((err) => console.error('[Auth] Token refresh failed', err));
  };

  // Initial login / setup
  useEffect(() => {
    const doLogin = async () => {
      try {
        const t = await fetchToken();
        console.log('[Auth] Initial token fetched', t);
        setToken(t);
        scheduleRefresh(t);
      } catch (err) {
        console.error('Authentication failed', err);
        toast.error('Authentication failed. Please try again later.');
      }
    };
    void doLogin();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async () => {
    refreshToken();
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
