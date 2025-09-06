import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { AuthContext } from '@/hooks/useAuth';
import { fetchToken, refreshToken, logout as apiLogout } from '@/api/auth';

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delayMs = Math.max(TOKEN_EXPIRATION_SEC - 5, 1) * 1000;
    console.log(`[Auth] Next refresh in ${delayMs} ms`);
    timerRef.current = setTimeout(refresh, delayMs);
  };

  const refresh = () => {
    console.log('[Auth] Refreshing token...');
    refreshToken()
      .then(() => {
        console.log('[Auth] Token refreshed');
        scheduleRefresh();
      })
      .catch((err) => console.error('[Auth] Token refresh failed', err));
  };

  useEffect(() => {
    const init = async () => {
      try {
        await fetchToken();
        scheduleRefresh();
      } catch (err) {
        console.error('Authentication failed', err);
        toast.error('Authentication failed. Please try again later.');
      }
    };
    void init();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async () => {
    refresh();
  };

  const logout = () => {
    apiLogout().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
