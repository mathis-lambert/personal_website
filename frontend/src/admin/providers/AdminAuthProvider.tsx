import React, { createContext, useContext, useMemo, useState } from 'react';
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
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);

  const login = async ({ username, password }: { username: string; password: string }) => {
    const t = await apiLogin(username, password);
    setToken(t);
  };

  const logout = () => setToken(null);

  const value = useMemo(() => ({ token, login, logout }), [token]);

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
};

