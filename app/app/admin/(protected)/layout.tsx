import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import AdminLayout from "@/admin/AdminLayout";
import { authOptions } from "@/lib/auth/options";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }

  return <AdminLayout>{children}</AdminLayout>;
}
