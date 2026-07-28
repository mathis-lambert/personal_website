import type { NextRequest } from "next/server";

export const parsePositiveInt = (
  req: NextRequest,
  key: string,
): number | undefined => {
  const raw = req.nextUrl.searchParams.get(key);
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
};
