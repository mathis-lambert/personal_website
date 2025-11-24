import { getEventsCollection } from "@/lib/db/collections";

type Granularity = "hour" | "day" | "month";

type EventRecord = {
  job_id?: string;
  action?: string;
  created_at?: Date | string;
  request_body?: Record<string, unknown>;
  [k: string]: unknown;
};

type EventFilter = {
  created_at?: { $gte?: Date; $lte?: Date };
  action?: { $in: string[] };
};

const parseDate = (value?: string, fallback?: Date): Date | null => {
  if (!value) return fallback ?? null;
  const trimmed = value.trim();
  const normalized = trimmed.endsWith("Z") ? trimmed : `${trimmed}Z`;
  const dt = new Date(normalized);
  if (Number.isNaN(dt.getTime())) {
    return fallback ?? null;
  }
  return dt;
};

const startOfBucket = (date: Date, granularity: Granularity): Date => {
  const dt = new Date(date);
  if (granularity === "month") {
    dt.setUTCDate(1);
    dt.setUTCHours(0, 0, 0, 0);
  } else if (granularity === "day") {
    dt.setUTCHours(0, 0, 0, 0);
  } else {
    dt.setUTCMinutes(0, 0, 0);
  }
  return dt;
};

const formatBucket = (date: Date, granularity: Granularity): string => {
  if (granularity === "month") return date.toISOString().slice(0, 7);
  if (granularity === "day") return date.toISOString().slice(0, 10);
  const iso = date.toISOString();
  return `${iso.slice(0, 13)}:00Z`;
};

const normalizeEvent = (evt: EventRecord): EventRecord => {
  const created =
    evt.created_at instanceof Date
      ? evt.created_at.toISOString()
      : typeof evt.created_at === "string"
        ? evt.created_at
        : new Date().toISOString();
  const { _id, ...rest } = evt as { _id?: unknown };
  void _id;
  return { ...rest, created_at: created };
};

export async function logEvent(
  action: string,
  requestBody: Record<string, unknown>,
  jobId?: string,
) {
  const collection = await getEventsCollection();
  const event = {
    job_id: jobId ?? undefined,
    action,
    request_body: requestBody,
    created_at: new Date(),
  };
  await collection.insertOne(event);
}

export async function listEvents(options: {
  start?: string;
  end?: string;
  action?: string | string[];
  limit?: number;
  skip?: number;
  sort?: "asc" | "desc";
}) {
  const collection = await getEventsCollection();
  const start = parseDate(options.start);
  const end = parseDate(options.end);
  const actions = Array.isArray(options.action)
    ? options.action
    : options.action
      ? options.action
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      : null;

  const filter: EventFilter = {};
  if (start || end) {
    filter.created_at = {};
    if (start) filter.created_at.$gte = start;
    if (end) filter.created_at.$lte = end;
  }
  if (actions && actions.length) {
    filter.action = { $in: actions };
  }

  const skip = Math.max(0, options.skip ?? 0);
  const limit = Math.max(0, Math.min(options.limit ?? 50, 500));
  const sortDir = options.sort === "asc" ? 1 : -1;

  const cursor = collection
    .find(filter)
    .sort({ created_at: sortDir })
    .skip(skip);
  if (limit) cursor.limit(limit);

  const [items, total] = await Promise.all([
    cursor.toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    total,
    items: items.map((evt) => normalizeEvent(evt as EventRecord)),
  };
}

export async function analyticsEvents(options: {
  start?: string;
  end?: string;
  granularity?: Granularity;
  action?: string;
  groupBy?: "action" | "location";
}) {
  const granularity = options.granularity ?? "day";
  const now = new Date();
  const defaultStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const start = parseDate(options.start, defaultStart)!;
  const end = parseDate(options.end, now)!;

  const actionsFilter = options.action
    ? options.action
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    : null;

  const collection = await getEventsCollection();
  const filter: EventFilter = {
    created_at: { $gte: start, $lte: end },
  };
  if (actionsFilter && actionsFilter.length) {
    filter.action = { $in: actionsFilter };
  }

  const events = (await collection
    .find(filter, { projection: { action: 1, request_body: 1, created_at: 1 } })
    .toArray()) as EventRecord[];

  type BucketMap = Record<string, Record<string, number>>;
  const buckets: BucketMap = {};
  const actionsSet = new Set<string>();
  let totalCount = 0;
  const totalByAction: Record<string, number> = {};

  for (const evt of events) {
    if (!evt?.created_at) continue;
    const created =
      evt.created_at instanceof Date
        ? evt.created_at
        : new Date(evt.created_at);
    if (Number.isNaN(created.getTime())) continue;
    const action = (evt.action ?? "unknown") as string;
    if (actionsFilter && !actionsFilter.includes(action)) continue;

    const groupValue =
      options.groupBy === "location"
        ? ((evt.request_body?.location as string) ?? "unknown")
        : action;

    const bucket = startOfBucket(created, granularity);
    const label = formatBucket(bucket, granularity);

    buckets[label] = buckets[label] || {};
    buckets[label]![groupValue] = (buckets[label]![groupValue] ?? 0) + 1;
    actionsSet.add(groupValue);
    totalByAction[groupValue] = (totalByAction[groupValue] ?? 0) + 1;
    totalCount += 1;
  }

  const series: Array<Record<string, number | string>> = [];
  const cursor = startOfBucket(start, granularity);
  const endBucket = startOfBucket(end, granularity);
  while (cursor <= endBucket) {
    const label = formatBucket(cursor, granularity);
    const values = buckets[label] ?? {};
    const entry: Record<string, number | string> = {
      bucket: label,
      total: Object.values(values).reduce((acc, v) => acc + (v as number), 0),
    };
    for (const action of actionsSet) {
      entry[action] = values[action] ?? 0;
    }
    series.push(entry);

    if (granularity === "month") {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    } else if (granularity === "day") {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    } else {
      cursor.setUTCHours(cursor.getUTCHours() + 1);
    }
  }

  return {
    ok: true,
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
      granularity,
    },
    actions: Array.from(actionsSet).sort(),
    series,
    totals: { total: totalCount, byAction: totalByAction },
    group_by: options.groupBy ?? "action",
  };
}
