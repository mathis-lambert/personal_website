import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AuthContext } from '@/hooks/useAuth';
import { fetchToken } from '@/api/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);

  const login = async () => {
    try {
      const t = await fetchToken();
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

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
