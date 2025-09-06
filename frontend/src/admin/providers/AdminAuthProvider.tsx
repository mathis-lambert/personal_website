import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { login as apiLogin } from '@/api/auth';

interface AdminAuthContextType {
  token: string | null;
  login: (creds: { username: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminAuth = (): AdminAuthContextType => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx)
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);

  const login = async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => {
    const { access_token, expires_in } = await apiLogin(username, password);
    setToken(access_token);
    setExpiresIn(expires_in);
  };

  const logout = () => {
    setToken(null);
    setExpiresIn(null);
  };

  useEffect(() => {
    // Expires in is in seconds
    if (expiresIn) {
      const timer = setTimeout(() => {
        setToken(null);
        setExpiresIn(null);
      }, expiresIn * 1000);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [expiresIn]);

  const value = useMemo(
    () => ({ token, expiresIn, login, logout }),
    [token, expiresIn],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
