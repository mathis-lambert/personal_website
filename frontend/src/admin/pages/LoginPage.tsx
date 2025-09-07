import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/admin/providers/AdminAuthProvider';

const LoginPage: React.FC = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login({ username, password });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError((err as Error)?.message ?? 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm border rounded-lg p-6 bg-card text-card-foreground shadow-sm"
      >
        <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
        <div className="space-y-3">
          <div>
            <label className="text-sm block mb-1">Username</label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-background"
              required
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-background"
              required
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
          <a
            href="/"
            className="w-full rounded-md border px-3 py-2 bg-blue-500 text-white text-center block"
          >
            Back to Home
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
