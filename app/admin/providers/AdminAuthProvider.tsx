"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import React, { createContext, useContext, useMemo } from "react";

interface AdminAuthContextType {
  token: string | null;
  login: (creds: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export const useAdminAuth = (): AdminAuthContextType => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session, status } = useSession();

  const login = async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => {
    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });
    if (res?.error) {
      throw new Error(res.error);
    }
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  const value = useMemo(
    () => ({
      token: session ? "session" : null,
      login,
      logout,
      loading: status === "loading",
    }),
    [session, status],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
