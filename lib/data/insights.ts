import {
  getApiRequestLogsCollection,
  getChatConversationTurnsCollection,
  getUiEventsCollection,
} from "@/lib/db/collections";
import type { AdminInsights, InsightsGranularity } from "@/types";

/**
 * What the site owner needs to know: who came, what they read, did they get
 * in touch, what did they ask the assistant. Mostly from `ui_events` and the
 * chat log, not the request log.
 *
 * Infrastructure health is still here, reduced to the three numbers worth
 * glancing at.
 */

const DAY_MS = 86_400_000;

const parseDate = (value: string | undefined, fallback: Date): Date => {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

/**
 * Hour buckets under three days, month buckets past six, days in between. A
 * ninety-day range plotted hourly is 2160 points of noise.
 */
const pickGranularity = (spanMs: number): InsightsGranularity => {
  if (spanMs <= 3 * DAY_MS) return "hour";
  if (spanMs > 180 * DAY_MS) return "month";
  return "day";
};

const MONGO_DATE_FORMAT: Record<InsightsGranularity, string> = {
  hour: "%Y-%m-%dT%H:00",
  day: "%Y-%m-%d",
  month: "%Y-%m",
};

/** Every bucket in the range, so a quiet day plots as zero instead of vanishing. */
const emptyBuckets = (
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

/** A hostname is what you recognise; the full URL with its query string is not. */
const referrerSource = (referrer: string | null | undefined): string | null => {
  if (!referrer) return null;
  try {
    const { hostname } = new URL(referrer);
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

export async function getInsights(input: {
  start?: string;
  end?: string;
}): Promise<AdminInsights> {
  const now = new Date();
  const end = parseDate(input.end, now);
  const start = parseDate(input.start, new Date(end.getTime() - 30 * DAY_MS));

  const spanMs = Math.max(end.getTime() - start.getTime(), 1);
  const granularity = pickGranularity(spanMs);

  // The same length of time immediately before, so every headline number can
  // say whether it is going up or down.
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(start.getTime() - spanMs);

  const events = await getUiEventsCollection();
  const logs = await getApiRequestLogsCollection();
  const turns = await getChatConversationTurnsCollection();

  const inRange = { timestamp: { $gte: start, $lte: end } };
  const inPrevious = { timestamp: { $gte: previousStart, $lte: previousEnd } };

  const countVisitors = (window: object) =>
    events
      .aggregate<{ n: number }>([
        { $match: { ...window, sessionId: { $ne: null } } },
        { $group: { _id: "$sessionId" } },
        { $count: "n" },
      ])
      .next()
      .then((row) => row?.n ?? 0);

  const countConversations = (window: object) =>
    turns
      .aggregate<{ n: number }>([
        { $match: window },
        { $group: { _id: "$conversationId" } },
        { $count: "n" },
      ])
      .next()
      .then((row) => row?.n ?? 0);

  const [
    visitors,
    visitorsBefore,
    pageViews,
    pageViewsBefore,
    conversations,
    conversationsBefore,
    resumeDownloads,
    resumeDownloadsBefore,
  ] = await Promise.all([
    countVisitors(inRange),
    countVisitors(inPrevious),
    events.countDocuments({ ...inRange, name: "page_view" }),
    events.countDocuments({ ...inPrevious, name: "page_view" }),
    countConversations(inRange),
    countConversations(inPrevious),
    events.countDocuments({ ...inRange, name: "resume_export_click" }),
    events.countDocuments({ ...inPrevious, name: "resume_export_click" }),
  ]);

  const trafficRows = await events
    .aggregate<{ _id: string; views: number; visitors: string[] }>([
      { $match: { ...inRange, name: "page_view" } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: MONGO_DATE_FORMAT[granularity],
              date: "$timestamp",
            },
          },
          views: { $sum: 1 },
          visitors: { $addToSet: "$sessionId" },
        },
      },
    ])
    .toArray();

  const byBucket = new Map(trafficRows.map((row) => [row._id, row]));
  const traffic = emptyBuckets(start, end, granularity).map((bucket) => ({
    bucket,
    views: byBucket.get(bucket)?.views ?? 0,
    visitors: byBucket.get(bucket)?.visitors.filter(Boolean).length ?? 0,
  }));

  /**
   * Titles come from the event the browser sent, not from a join against the
   * content collections: a project renamed or deleted since should still show
   * the name it was opened under.
   */
  const content = await events
    .aggregate<{
      _id: { kind: string; slug: string };
      title: string;
      opens: number;
    }>([
      { $match: { ...inRange, name: { $in: ["project_open", "note_open"] } } },
      {
        $group: {
          _id: {
            kind: { $cond: [{ $eq: ["$name", "project_open"] }, "project", "note"] },
            slug: "$properties.slug",
          },
          title: { $last: "$properties.title" },
          opens: { $sum: 1 },
        },
      },
      { $sort: { opens: -1 } },
      { $limit: 12 },
    ])
    .toArray()
    .then((rows) =>
      rows
        .filter((row) => row._id.slug)
        .map((row) => ({
          kind: row._id.kind as "project" | "note",
          slug: String(row._id.slug),
          title: row.title || String(row._id.slug),
          opens: row.opens,
        })),
    );

  const pages = await events
    .aggregate<{ _id: string; views: number; visitors: string[] }>([
      { $match: { ...inRange, name: "page_view", path: { $ne: null } } },
      {
        $group: { _id: "$path", views: { $sum: 1 }, visitors: { $addToSet: "$sessionId" } },
      },
      { $sort: { views: -1 } },
      { $limit: 12 },
    ])
    .toArray()
    .then((rows) =>
      rows.map((row) => ({
        path: row._id,
        views: row.views,
        visitors: row.visitors.filter(Boolean).length,
      })),
    );

  /**
   * Distinct sessions per source, from page views only.
   *
   * Every event carries `document.referrer`, so counting all of them measured
   * interactions rather than arrivals: one visitor who loaded a page, opened a
   * project and asked the assistant counted three times against the same
   * source. Grouping on (referrer, session) and counting the pairs makes the
   * number what the panel claims it is.
   */
  const referrers = await events
    .aggregate<{ _id: { referrer: string | null; session: string | null } }>([
      { $match: { ...inRange, name: "page_view", referrer: { $ne: null } } },
      { $group: { _id: { referrer: "$referrer", session: "$sessionId" } } },
    ])
    .toArray()
    .then((rows) => {
      const bySource = new Map<string, Set<string>>();
      for (const row of rows) {
        const source = referrerSource(row._id.referrer) ?? "Direct";
        const sessions = bySource.get(source) ?? new Set<string>();
        // A missing sessionId is still one arrival; key it by the row itself.
        sessions.add(row._id.session ?? `anon:${sessions.size}`);
        bySource.set(source, sessions);
      }
      return [...bySource.entries()]
        .map(([source, sessions]) => ({ source, visitors: sessions.size }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 8);
    });

  const [chatOpened, chatSubmitted, outboundClicks, shares] = await Promise.all([
    events.countDocuments({ ...inRange, name: "chat_open" }),
    events.countDocuments({ ...inRange, name: "chat_submit" }),
    events.countDocuments({ ...inRange, name: "project_external_open" }),
    events.countDocuments({ ...inRange, name: "note_share" }),
  ]);

  /**
   * The questions themselves. This is the one thing here no off-the-shelf
   * analytics tool could show, because the assistant is part of the site.
   */
  const questions = await turns
    .find(
      { ...inRange, "request.lastUserMessage": { $nin: [null, ""] } },
      {
        projection: {
          conversationId: 1,
          timestamp: 1,
          status: 1,
          "request.lastUserMessage": 1,
        },
        sort: { timestamp: -1 },
        limit: 12,
      },
    )
    .toArray()
    .then((rows) =>
      rows.map((row) => ({
        conversationId: row.conversationId,
        at: row.timestamp.toISOString(),
        question: row.request?.lastUserMessage ?? "",
        failed: row.status === "failed",
      })),
    );

  const [requests, errors, slowest] = await Promise.all([
    logs.countDocuments(inRange),
    logs.countDocuments({ ...inRange, ok: false }),
    logs
      .aggregate<{ _id: string; p95: number }>([
        { $match: inRange },
        {
          $group: {
            _id: "$route",
            p95: {
              $percentile: {
                input: "$durationMs",
                p: [0.95],
                method: "approximate",
              },
            },
          },
        },
        { $set: { p95: { $first: "$p95" } } },
        { $sort: { p95: -1 } },
        { $limit: 3 },
      ])
      .toArray()
      .then((rows) =>
        rows.map((row) => ({ route: row._id, p95: Math.round(row.p95 ?? 0) })),
      ),
  ]);

  return {
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
      granularity,
    },
    kpis: {
      visitors: { value: visitors, previous: visitorsBefore },
      pageViews: { value: pageViews, previous: pageViewsBefore },
      conversations: { value: conversations, previous: conversationsBefore },
      resumeDownloads: {
        value: resumeDownloads,
        previous: resumeDownloadsBefore,
      },
    },
    traffic,
    content,
    pages,
    referrers,
    engagement: { chatOpened, chatSubmitted, outboundClicks, shares },
    questions,
    health: {
      requests,
      errors,
      errorRate: requests ? errors / requests : 0,
      slowest,
    },
  };
}
