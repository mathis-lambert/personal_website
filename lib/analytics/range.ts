import type { InsightsGranularity } from "@/types/analytics";
import { formatDate } from "@/lib/format";

const DAY_MS = 86_400_000;

export const ANALYTICS_RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

export const analyticsDates = (days: number) => {
  const end = new Date();
  const start = new Date(end.getTime() - days * DAY_MS);
  return { start: start.toISOString(), end: end.toISOString() };
};

export const analyticsBucketLabel = (
  bucket: string,
  granularity: InsightsGranularity,
) => {
  if (granularity === "hour") return `${bucket.slice(11, 13)}:00`;
  if (granularity === "month") return bucket;
  return formatDate(`${bucket}T00:00:00.000Z`, "short").replace(/ \d{4}$/, "");
};

const parseDate = (value: string | undefined, fallback: Date): Date => {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const pickGranularity = (spanMs: number): InsightsGranularity => {
  if (spanMs <= 3 * DAY_MS) return "hour";
  if (spanMs > 180 * DAY_MS) return "month";
  return "day";
};

export const MONGO_DATE_FORMAT: Record<InsightsGranularity, string> = {
  hour: "%Y-%m-%dT%H:00",
  day: "%Y-%m-%d",
  month: "%Y-%m",
};

export const analyticsRange = (input: {
  start?: string;
  end?: string;
}) => {
  const now = new Date();
  const end = parseDate(input.end, now);
  const start = parseDate(input.start, new Date(end.getTime() - 30 * DAY_MS));
  const spanMs = Math.max(end.getTime() - start.getTime(), 1);
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(start.getTime() - spanMs);

  return {
    start,
    end,
    previousStart,
    previousEnd,
    granularity: pickGranularity(spanMs),
  };
};

/** Every bucket in the range, so quiet periods plot as zero. */
export const emptyAnalyticsBuckets = (
  start: Date,
  end: Date,
  granularity: InsightsGranularity,
): string[] => {
  const keys: string[] = [];
  const cursor = new Date(start);

  if (granularity === "month") {
    cursor.setUTCDate(1);
    cursor.setUTCHours(0, 0, 0, 0);
    while (cursor <= end && keys.length < 400) {
      keys.push(cursor.toISOString().slice(0, 7));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return keys;
  }

  const step = granularity === "hour" ? 3_600_000 : DAY_MS;
  const width = granularity === "hour" ? 13 : 10;
  cursor.setUTCMinutes(0, 0, 0);
  if (granularity === "day") cursor.setUTCHours(0, 0, 0, 0);

  while (cursor.getTime() <= end.getTime() && keys.length < 400) {
    keys.push(cursor.toISOString().slice(0, width));
    cursor.setTime(cursor.getTime() + step);
  }
  return keys;
};
