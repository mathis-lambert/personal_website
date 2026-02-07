import type { NextRequest } from "next/server";

import type { AnalyticsGranularity, ApiActorType } from "@/types";

export type CommonAnalyticsParams = {
  start?: string;
  end?: string;
  route?: string;
  method?: string;
  actorType?: ApiActorType;
};

export const parseCommonAnalyticsParams = (
  req: NextRequest,
): CommonAnalyticsParams => {
  const params = req.nextUrl.searchParams;
  const actorTypeRaw = params.get("actor_type")?.trim();
  const actorType =
    actorTypeRaw === "public" || actorTypeRaw === "admin" || actorTypeRaw === "system"
      ? actorTypeRaw
      : undefined;

  return {
    start: params.get("start") ?? undefined,
    end: params.get("end") ?? undefined,
    route: params.get("route") ?? undefined,
    method: params.get("method")?.toUpperCase() ?? undefined,
    actorType,
  };
};

export const parseGranularity = (
  req: NextRequest,
): AnalyticsGranularity | undefined => {
  const value = req.nextUrl.searchParams.get("granularity");
  if (value === "hour" || value === "day" || value === "month") {
    return value;
  }
  return undefined;
};

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
