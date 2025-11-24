import { appendEvent, getEvents } from "./content";

type Granularity = "hour" | "day" | "month";

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

export async function logEvent(
  action: string,
  requestBody: Record<string, any>,
  jobId?: string,
) {
  const event = {
    job_id: jobId ?? undefined,
    action,
    request_body: requestBody,
    created_at: new Date().toISOString(),
  };
  await appendEvent(event);
}

export async function listEvents(options: {
  start?: string;
  end?: string;
  action?: string | string[];
  limit?: number;
  skip?: number;
  sort?: "asc" | "desc";
}) {
  const events = (await getEvents()) ?? [];
  const start = parseDate(options.start);
  const end = parseDate(options.end);
  const actions = Array.isArray(options.action)
    ? options.action
    : options.action
      ? options.action.split(",").map((v) => v.trim()).filter(Boolean)
      : null;

  let filtered = events.filter((evt) => {
    if (!evt) return false;
    const created = evt.created_at ? new Date(evt.created_at) : null;
    if (!created || Number.isNaN(created.getTime())) return false;
    if (start && created < start) return false;
    if (end && created > end) return false;
    if (actions && actions.length) {
      const act = evt.action ?? "";
      if (!actions.includes(act)) return false;
    }
    return true;
  });

  const total = filtered.length;
  const sortDir = options.sort === "asc" ? 1 : -1;
  filtered = filtered.sort((a, b) => {
    const da = new Date(a.created_at ?? 0).getTime();
    const db = new Date(b.created_at ?? 0).getTime();
    return sortDir * (da - db);
  });

  const skip = Math.max(0, options.skip ?? 0);
  const limit = Math.max(0, Math.min(options.limit ?? 50, 500));
  const sliced = filtered.slice(skip, limit ? skip + limit : undefined);
  return { total, items: sliced };
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

  const events = (await getEvents()) ?? [];

  type BucketMap = Record<string, Record<string, number>>;
  const buckets: BucketMap = {};
  const actionsSet = new Set<string>();
  let totalCount = 0;
  const totalByAction: Record<string, number> = {};

  for (const evt of events) {
    if (!evt?.created_at) continue;
    const created = new Date(evt.created_at);
    if (Number.isNaN(created.getTime())) continue;
    if (created < start || created > end) continue;
    const action = (evt.action ?? "unknown") as string;
    if (actionsFilter && !actionsFilter.includes(action)) continue;
    const groupValue =
      options.groupBy === "location"
        ? evt.request_body?.location ?? "unknown"
        : action;

    const bucket = startOfBucket(created, granularity);
    const label = formatBucket(bucket, granularity);

    buckets[label] = buckets[label] || {};
    buckets[label]![groupValue] = (buckets[label]![groupValue] ?? 0) + 1;
    actionsSet.add(groupValue);
    totalByAction[groupValue] = (totalByAction[groupValue] ?? 0) + 1;
    totalCount += 1;
  }

  // generate all buckets between start and end
  const series: Array<Record<string, any>> = [];
  const cursor = startOfBucket(start, granularity);
  const endBucket = startOfBucket(end, granularity);
  while (cursor <= endBucket) {
    const label = formatBucket(cursor, granularity);
    const values = buckets[label] ?? {};
    const entry: Record<string, any> = {
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
