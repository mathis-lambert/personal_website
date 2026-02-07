import { createHash } from "node:crypto";

import type { NextRequest } from "next/server";

const hashIp = (ip: string): string => {
  const salt =
    process.env.ANALYTICS_HASH_SALT || process.env.NEXTAUTH_SECRET || "analytics";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 24);
};

const hasSessionCookie = (cookie: string): boolean => {
  return (
    cookie.includes("next-auth.session-token") ||
    cookie.includes("__Secure-next-auth.session-token")
  );
};

const getClientIp = (req: NextRequest): string | undefined => {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const ip = forwarded || realIp;
  return ip || undefined;
};

export const inferActorType = (
  path: string,
): "public" | "admin" | "system" => {
  if (path.startsWith("/api/admin")) return "admin";
  return "public";
};

export const buildActorContext = (
  req: NextRequest,
  type?: "public" | "admin" | "system",
) => {
  const cookie = req.headers.get("cookie") || "";
  const ip = getClientIp(req);
  return {
    type: type ?? inferActorType(req.nextUrl.pathname),
    hasSession: hasSessionCookie(cookie),
    ipHash: ip ? hashIp(ip) : undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  };
};
