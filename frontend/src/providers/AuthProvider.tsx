import React, { useEffect, useState } from 'react';
import { AuthContext } from '@/hooks/useAuth';
import { fetchToken } from '@/api/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);

  const login = async () => {
    const t = await fetchToken();
    setToken(t);
  };

  const logout = () => {
    setToken(null);
  };

  useEffect(() => {
    void login();
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
