import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AuthContext } from '@/hooks/useAuth';
import { fetchToken } from '@/api/auth';

// Token expiration time (in seconds) provided by Vite
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

  const login = async () => {
    try {
      const t = await fetchToken();
      console.log('[Auth] Initial token fetched', t);
      setToken(t);
    } catch (err) {
      console.error('Authentication failed', err);
      toast.error('Authentication failed. Please try again later.');
    }
  };

  const logout = () => {
    setToken(null);
  };

  useEffect(() => {
    void login();
  }, []);

  // Auto-refresh the token before it expires
  useEffect(() => {
    const refreshMs = Math.max(TOKEN_EXPIRATION_SEC - 5, 1) * 1000; // refresh 5 s before the expiration
    console.log(`[Auth] Setting up auto-refresh every ${refreshMs} ms`);
    const id = setInterval(() => {
      console.log('[Auth] Refreshing token...');
      fetchToken()
        .then((t) =>
          setToken((prev) => {
            if (prev !== t) {
              console.log('[Auth] Token updated');
              return t;
            }
            console.log('[Auth] Token unchanged');
            return prev;
          }),
        )
        .catch((err) => console.error('[Auth] Token refresh failed', err));
    }, refreshMs);
    return () => clearInterval(id);
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
