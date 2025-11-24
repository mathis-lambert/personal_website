import type { ReactNode } from 'react';

import Layout from '@/layouts/Layout';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}
