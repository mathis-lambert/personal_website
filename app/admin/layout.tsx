import type { ReactNode } from "react";

import { AdminAuthProvider } from "@/components/admin/providers/AdminAuthProvider";

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
