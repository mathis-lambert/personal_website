import crypto from "crypto";

import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const ADMIN_USER =
  process.env.INTERNAL_API_USERNAME ||
  process.env.ADMIN_USERNAME ||
  "admin";
const ADMIN_PASSWORD =
  process.env.INTERNAL_API_PASSWORD ||
  process.env.ADMIN_PASSWORD ||
  "";

const verifyPassword = (value: string) => {
  if (!ADMIN_PASSWORD) return false;
  const expected = Buffer.from(ADMIN_PASSWORD);
  const supplied = Buffer.from(value);
  // constant-time comparison
  if (expected.length !== supplied.length) return false;
  return crypto.timingSafeEqual(expected, supplied);
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) return null;
        if (credentials.username !== ADMIN_USER) return null;
        if (!verifyPassword(credentials.password)) return null;
        return { id: ADMIN_USER, name: ADMIN_USER, role: "admin" };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role || "admin";
      }
      return session;
    },
  },
};
