import {
  getApiRequestLogsCollection,
  getChatConversationTurnsCollection,
  getUiEventsCollection,
} from "@/lib/db/collections";
import {
  analyticsRange,
  emptyAnalyticsBuckets,
  MONGO_DATE_FORMAT,
} from "@/lib/analytics/range";
import { getContentPerformance } from "@/lib/data/contentInsights";
import type { AdminInsights } from "@/types/analytics";

/**
 * What the site owner needs to know: who came, what they read, did they get
 * in touch, what did they ask the assistant. Mostly from `ui_events` and the
 * chat log, not the request log.
 *
 * Infrastructure health is still here, reduced to the three numbers worth
 * glancing at.
 */

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
  const { start, end, previousStart, previousEnd, granularity } =
    analyticsRange(input);

  const events = await getUiEventsCollection();
  const logs = await getApiRequestLogsCollection();
  const turns = await getChatConversationTurnsCollection();

  const inRange = { timestamp: { $gte: start, $lte: end } };
  const inPrevious = { timestamp: { $gte: previousStart, $lte: previousEnd } };
  const publicInRange = { ...inRange, "actor.type": "public" };
  const publicInPrevious = { ...inPrevious, "actor.type": "public" };

  const countVisitors = (window: object) =>
    events
      .aggregate<{ n: number }>([
        {
          $match: {
            ...window,
            name: "page_view",
            "actor.type": "public",
            sessionId: { $nin: [null, ""] },
          },
        },
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
    events.countDocuments({ ...publicInRange, name: "page_view" }),
    events.countDocuments({ ...publicInPrevious, name: "page_view" }),
    countConversations(inRange),
    countConversations(inPrevious),
    events.countDocuments({ ...publicInRange, name: "resume_export_click" }),
    events.countDocuments({ ...publicInPrevious, name: "resume_export_click" }),
  ]);

  const trafficRows = await events
    .aggregate<{ _id: string; views: number; visitors: string[] }>([
      { $match: { ...publicInRange, name: "page_view" } },
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
  const traffic = emptyAnalyticsBuckets(start, end, granularity).map((bucket) => ({
    bucket,
    views: byBucket.get(bucket)?.views ?? 0,
    visitors: byBucket.get(bucket)?.visitors.filter(Boolean).length ?? 0,
  }));

  const content = await getContentPerformance({ start, end });

  const pages = await events
    .aggregate<{ _id: string; views: number; visitors: string[] }>([
      { $match: { ...publicInRange, name: "page_view", path: { $ne: null } } },
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
      { $match: { ...publicInRange, name: "page_view", referrer: { $ne: null } } },
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
    events.countDocuments({ ...publicInRange, name: "chat_open" }),
    events.countDocuments({ ...publicInRange, name: "chat_submit" }),
    events.countDocuments({ ...publicInRange, name: "project_external_open" }),
    events.countDocuments({
      ...publicInRange,
      name: { $in: ["content_share", "note_share"] },
    }),
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
