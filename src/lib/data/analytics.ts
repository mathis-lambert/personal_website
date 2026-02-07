import type { Filter } from "mongodb";

import {
  getApiRequestLogsCollection,
  getUiEventsCollection,
  type ApiRequestLogDocument,
  type UiEventDocument,
} from "@/lib/db/collections";
import { redactValue } from "@/lib/analytics/redaction";
import type {
  AdminAnalyticsActivityResponse,
  AdminAnalyticsEndpointsResponse,
  AdminAnalyticsErrorsResponse,
  AdminAnalyticsOverviewResponse,
  AdminAnalyticsTimeseriesResponse,
  AnalyticsActivityItem,
  AnalyticsGranularity,
  ApiActorType,
} from "@/types";

type RangeInput = {
  start?: string;
  end?: string;
};

type ApiFilterInput = RangeInput & {
  route?: string;
  method?: string;
  actorType?: ApiActorType;
};

type ErrorFilterInput = ApiFilterInput & {
  statusMin?: number;
  statusMax?: number;
};

type ActivityInput = ApiFilterInput & {
  type?: "api" | "ui" | "all";
  limit?: number;
  skip?: number;
};

type EndpointInput = ApiFilterInput & {
  limit?: number;
};

type UiEventInput = {
  name: string;
  path?: string;
  referrer?: string;
  sessionId?: string;
  timestamp?: string;
  properties?: Record<string, unknown>;
  actor: UiEventDocument["actor"];
};

const DAY_MS = 24 * 60 * 60 * 1000;

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const parseDate = (value?: string, fallback?: Date): Date => {
  if (!value) return fallback ?? new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback ?? new Date();
  }
  return parsed;
};

const resolveRange = (input: RangeInput) => {
  const now = new Date();
  const end = parseDate(input.end, now);
  const defaultStart = new Date(end.getTime() - 7 * DAY_MS);
  const start = parseDate(input.start, defaultStart);
  return { start, end };
};

const percentile = (values: number[], p: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower] ?? 0;
  const weight = position - lower;
  return (sorted[lower] ?? 0) * (1 - weight) + (sorted[upper] ?? 0) * weight;
};

const buildApiMatch = (input: ApiFilterInput): Filter<ApiRequestLogDocument> => {
  const { start, end } = resolveRange(input);
  const match: Filter<ApiRequestLogDocument> = {
    timestamp: { $gte: start, $lte: end },
  };

  if (input.route?.trim()) {
    match.route = input.route.trim();
  }

  if (input.method?.trim()) {
    match.method = input.method.trim().toUpperCase();
  }

  if (input.actorType) {
    match["actor.type"] = input.actorType;
  }

  return match;
};

const buildErrorMatch = (
  input: ErrorFilterInput,
): Filter<ApiRequestLogDocument> => {
  const match = buildApiMatch(input);
  const min = input.statusMin ?? 400;
  const max = input.statusMax ?? 599;
  match.status = { $gte: min, $lte: max };
  return match;
};

const getBucketFormat = (granularity: AnalyticsGranularity): string => {
  if (granularity === "month") return "%Y-%m";
  if (granularity === "day") return "%Y-%m-%d";
  return "%Y-%m-%dT%H:00:00Z";
};

const toBucketLabel = (date: Date, granularity: AnalyticsGranularity): string => {
  const dt = new Date(date);
  if (granularity === "month") {
    dt.setUTCDate(1);
    dt.setUTCHours(0, 0, 0, 0);
    return dt.toISOString().slice(0, 7);
  }
  if (granularity === "day") {
    dt.setUTCHours(0, 0, 0, 0);
    return dt.toISOString().slice(0, 10);
  }
  dt.setUTCMinutes(0, 0, 0);
  return `${dt.toISOString().slice(0, 13)}:00:00Z`;
};

const addBucketStep = (date: Date, granularity: AnalyticsGranularity): Date => {
  const dt = new Date(date);
  if (granularity === "month") {
    dt.setUTCMonth(dt.getUTCMonth() + 1);
  } else if (granularity === "day") {
    dt.setUTCDate(dt.getUTCDate() + 1);
  } else {
    dt.setUTCHours(dt.getUTCHours() + 1);
  }
  return dt;
};

const toIso = (value: Date | string): string => {
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

export async function trackUiEvent(input: UiEventInput): Promise<void> {
  const collection = await getUiEventsCollection();
  const timestamp = parseDate(input.timestamp, new Date());
  await collection.insertOne({
    kind: "ui_event",
    timestamp,
    name: input.name,
    path: input.path,
    referrer: input.referrer,
    sessionId: input.sessionId,
    actor: input.actor,
    properties: (redactValue(input.properties ?? {}) as Record<string, unknown>) || {},
  });
}

export async function getAnalyticsOverview(
  input: ApiFilterInput,
): Promise<AdminAnalyticsOverviewResponse> {
  const apiCollection = await getApiRequestLogsCollection();
  const uiCollection = await getUiEventsCollection();
  const { start, end } = resolveRange(input);
  const match = buildApiMatch(input);

  const [summaryRow, durationRows, distinctRoutes, distinctVisitors, uiCount] =
    await Promise.all([
      apiCollection
        .aggregate<{
          totalRequests: number;
          errorRequests: number;
          avgLatencyMs: number;
        }>([
          { $match: match },
          {
            $group: {
              _id: null,
              totalRequests: { $sum: 1 },
              errorRequests: {
                $sum: {
                  $cond: [{ $gte: ["$status", 400] }, 1, 0],
                },
              },
              avgLatencyMs: { $avg: "$durationMs" },
            },
          },
        ])
        .next(),
      apiCollection
        .find(match, { projection: { durationMs: 1 } })
        .toArray()
        .then((rows) => rows.map((row) => Number(row.durationMs ?? 0))),
      apiCollection.distinct("route", match),
      apiCollection.distinct("actor.ipHash", {
        timestamp: { $gte: start, $lte: end },
        "actor.ipHash": { $exists: true, $ne: null },
      }),
      uiCollection.countDocuments({ timestamp: { $gte: start, $lte: end } }),
    ]);

  const totalRequests = summaryRow?.totalRequests ?? 0;
  const errorRequests = summaryRow?.errorRequests ?? 0;
  const avgLatencyMs = summaryRow?.avgLatencyMs ?? 0;

  return {
    ok: true,
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    summary: {
      totalRequests,
      errorRequests,
      errorRate: totalRequests > 0 ? errorRequests / totalRequests : 0,
      avgLatencyMs,
      p95LatencyMs: percentile(durationRows, 0.95),
      uniqueRoutes: distinctRoutes.length,
      uniqueVisitors: distinctVisitors.length,
      uiEvents: uiCount,
    },
  };
}

export async function getAnalyticsTimeseries(input: {
  start?: string;
  end?: string;
  granularity?: AnalyticsGranularity;
  actorType?: ApiActorType;
  route?: string;
  method?: string;
}): Promise<AdminAnalyticsTimeseriesResponse> {
  const apiCollection = await getApiRequestLogsCollection();
  const uiCollection = await getUiEventsCollection();
  const granularity = input.granularity ?? "day";
  const { start, end } = resolveRange(input);
  const format = getBucketFormat(granularity);
  const apiMatch = buildApiMatch(input);

  const uiMatch: Filter<UiEventDocument> = {
    timestamp: { $gte: start, $lte: end },
  };
  if (input.actorType && input.actorType !== "system") {
    uiMatch["actor.type"] = input.actorType;
  }

  const [apiBuckets, uiBuckets] = await Promise.all([
    apiCollection
      .aggregate<{ _id: string; requests: number; errors: number }>([
        { $match: apiMatch },
        {
          $group: {
            _id: {
              $dateToString: {
                format,
                date: "$timestamp",
                timezone: "UTC",
              },
            },
            requests: { $sum: 1 },
            errors: {
              $sum: {
                $cond: [{ $gte: ["$status", 400] }, 1, 0],
              },
            },
          },
        },
      ])
      .toArray(),
    uiCollection
      .aggregate<{ _id: string; uiEvents: number }>([
        { $match: uiMatch },
        {
          $group: {
            _id: {
              $dateToString: {
                format,
                date: "$timestamp",
                timezone: "UTC",
              },
            },
            uiEvents: { $sum: 1 },
          },
        },
      ])
      .toArray(),
  ]);

  const apiMap = new Map(
    apiBuckets.map((entry) => [entry._id, { requests: entry.requests, errors: entry.errors }]),
  );
  const uiMap = new Map(uiBuckets.map((entry) => [entry._id, entry.uiEvents]));

  const series: AdminAnalyticsTimeseriesResponse["series"] = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const bucket = toBucketLabel(cursor, granularity);
    series.push({
      bucket,
      requests: apiMap.get(bucket)?.requests ?? 0,
      errors: apiMap.get(bucket)?.errors ?? 0,
      uiEvents: uiMap.get(bucket) ?? 0,
    });
    cursor = addBucketStep(cursor, granularity);
  }

  return {
    ok: true,
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
      granularity,
    },
    series,
  };
}

export async function getAnalyticsEndpoints(
  input: EndpointInput,
): Promise<AdminAnalyticsEndpointsResponse> {
  const collection = await getApiRequestLogsCollection();
  const { start, end } = resolveRange(input);
  const match = buildApiMatch(input);
  const limit = clamp(input.limit ?? 25, 1, 100);

  const grouped = await collection
    .aggregate<{
      _id: { route: string; method: string };
      count: number;
      errors: number;
      avgLatencyMs: number;
      lastSeenAt: Date;
    }>([
      { $match: match },
      {
        $group: {
          _id: { route: "$route", method: "$method" },
          count: { $sum: 1 },
          errors: { $sum: { $cond: [{ $gte: ["$status", 400] }, 1, 0] } },
          avgLatencyMs: { $avg: "$durationMs" },
          lastSeenAt: { $max: "$timestamp" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ])
    .toArray();

  const items = await Promise.all(
    grouped.map(async (row) => {
      const durations = await collection
        .find(
          {
            ...match,
            route: row._id.route,
            method: row._id.method,
          },
          { projection: { durationMs: 1 } },
        )
        .toArray()
        .then((docs) => docs.map((doc) => Number(doc.durationMs ?? 0)));

      return {
        route: row._id.route,
        method: row._id.method,
        count: row.count,
        errorRate: row.count > 0 ? row.errors / row.count : 0,
        avgLatencyMs: row.avgLatencyMs,
        p50LatencyMs: percentile(durations, 0.5),
        p95LatencyMs: percentile(durations, 0.95),
        lastSeenAt: toIso(row.lastSeenAt),
      };
    }),
  );

  return {
    ok: true,
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    items,
  };
}

export async function getAnalyticsErrors(
  input: ErrorFilterInput & { limit?: number; skip?: number },
): Promise<AdminAnalyticsErrorsResponse> {
  const collection = await getApiRequestLogsCollection();
  const match = buildErrorMatch(input);
  const limit = clamp(input.limit ?? 50, 1, 500);
  const skip = Math.max(0, input.skip ?? 0);

  const [items, total] = await Promise.all([
    collection
      .find(match, {
        projection: {
          timestamp: 1,
          route: 1,
          path: 1,
          method: 1,
          status: 1,
          durationMs: 1,
          actor: 1,
          error: 1,
        },
      })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    collection.countDocuments(match),
  ]);

  return {
    ok: true,
    total,
    items: items.map((row) => ({
      timestamp: toIso(row.timestamp ?? new Date()),
      route: row.route,
      path: row.path,
      method: row.method,
      status: row.status,
      durationMs: row.durationMs,
      actorType: row.actor?.type ?? "public",
      message: row.error?.message,
    })),
  };
}

const mapApiActivity = (
  rows: ApiRequestLogDocument[],
): AnalyticsActivityItem[] => {
  return rows.map((row) => ({
    kind: "api_request",
    timestamp: toIso(row.timestamp),
    route: row.route,
    path: row.path,
    method: row.method,
    status: row.status,
    durationMs: row.durationMs,
    actorType: row.actor.type,
  }));
};

const mapUiActivity = (rows: UiEventDocument[]): AnalyticsActivityItem[] => {
  return rows.map((row) => ({
    kind: "ui_event",
    timestamp: toIso(row.timestamp),
    name: row.name,
    path: row.path,
    actorType: row.actor.type,
    sessionId: row.sessionId,
  }));
};

export async function getAnalyticsActivity(
  input: ActivityInput,
): Promise<AdminAnalyticsActivityResponse> {
  const apiCollection = await getApiRequestLogsCollection();
  const uiCollection = await getUiEventsCollection();
  const { start, end } = resolveRange(input);
  const limit = clamp(input.limit ?? 100, 1, 300);
  const skip = Math.max(0, input.skip ?? 0);
  const type = input.type ?? "all";

  if (type === "api") {
    const match = buildApiMatch(input);
    const [rows, total] = await Promise.all([
      apiCollection
        .find(match)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      apiCollection.countDocuments(match),
    ]);
    return { ok: true, total, items: mapApiActivity(rows) };
  }

  if (type === "ui") {
    const match: Filter<UiEventDocument> = {
      timestamp: { $gte: start, $lte: end },
    };
    if (input.actorType && input.actorType !== "system") {
      match["actor.type"] = input.actorType;
    }
    const [rows, total] = await Promise.all([
      uiCollection
        .find(match)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      uiCollection.countDocuments(match),
    ]);
    return { ok: true, total, items: mapUiActivity(rows) };
  }

  const apiMatch = buildApiMatch(input);
  const uiMatch: Filter<UiEventDocument> = {
    timestamp: { $gte: start, $lte: end },
  };
  if (input.actorType && input.actorType !== "system") {
    uiMatch["actor.type"] = input.actorType;
  }

  const fetchSize = skip + limit;

  const [apiRows, uiRows, apiTotal, uiTotal] = await Promise.all([
    apiCollection
      .find(apiMatch)
      .sort({ timestamp: -1 })
      .limit(fetchSize)
      .toArray(),
    uiCollection
      .find(uiMatch)
      .sort({ timestamp: -1 })
      .limit(fetchSize)
      .toArray(),
    apiCollection.countDocuments(apiMatch),
    uiCollection.countDocuments(uiMatch),
  ]);

  const merged = [...mapApiActivity(apiRows), ...mapUiActivity(uiRows)].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return {
    ok: true,
    total: apiTotal + uiTotal,
    items: merged.slice(skip, skip + limit),
  };
}
