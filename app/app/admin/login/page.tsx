import { redirect } from 'next/navigation';

import LoginPage from '@/admin/pages/LoginPage';
import { authOptions } from '@/lib/auth/options';
import { getServerSession } from 'next-auth';

export const metadata = {
  title: 'Admin Login',
};

export default async function AdminLogin() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/admin');
  }
  return <LoginPage />;
}
