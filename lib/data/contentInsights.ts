import {
  getNotesCollection,
  getProjectsCollection,
  getUiEventsCollection,
} from "@/lib/db/collections";
import { getPublishedContentSlug } from "@/lib/data/publications";
import {
  analyticsRange,
  emptyAnalyticsBuckets,
  MONGO_DATE_FORMAT,
} from "@/lib/analytics/range";
import type {
  ContentAnalyticsKind,
  ContentInsights,
  ContentPerformanceItem,
} from "@/types/analytics";

const publicWindow = (start: Date, end: Date) => ({
  timestamp: { $gte: start, $lte: end },
  "actor.type": "public",
});

const shareMatch = (kind: ContentAnalyticsKind, slug: string) => ({
  $or: [
    {
      name: "content_share",
      "properties.kind": kind,
      "properties.slug": slug,
    },
    ...(kind === "note"
      ? [{ name: "note_share", "properties.slug": slug }]
      : []),
  ],
});

const contentPath = (kind: ContentAnalyticsKind, slug: string) =>
  `/${kind === "project" ? "projects" : "notes"}/${slug}`;

export async function resolveContentAnalyticsSlug(
  kind: ContentAnalyticsKind,
  itemId: string,
): Promise<string | null> {
  return getPublishedContentSlug(
    kind === "project" ? "projects" : "notes",
    itemId,
  );
}

const countDistinctVisitors = async (
  start: Date,
  end: Date,
  path: string,
) => {
  const events = await getUiEventsCollection();
  return events
    .aggregate<{ n: number }>([
      {
        $match: {
          ...publicWindow(start, end),
          name: "page_view",
          path,
          sessionId: { $nin: [null, ""] },
        },
      },
      { $group: { _id: "$sessionId" } },
      { $count: "n" },
    ])
    .next()
    .then((row) => row?.n ?? 0);
};

export async function getContentAnalytics(input: {
  kind: ContentAnalyticsKind;
  slug: string;
  start?: string;
  end?: string;
}): Promise<ContentInsights> {
  const { kind, slug } = input;
  const { start, end, previousStart, previousEnd, granularity } =
    analyticsRange(input);
  const events = await getUiEventsCollection();
  const path = contentPath(kind, slug);

  const currentWindow = publicWindow(start, end);
  const previousWindow = publicWindow(previousStart, previousEnd);
  const currentShares = shareMatch(kind, slug);
  const previousShares = shareMatch(kind, slug);

  const [
    views,
    viewsBefore,
    visitors,
    visitorsBefore,
    shares,
    sharesBefore,
    viewRows,
    shareRows,
    shareChannels,
  ] = await Promise.all([
    events.countDocuments({ ...currentWindow, name: "page_view", path }),
    events.countDocuments({ ...previousWindow, name: "page_view", path }),
    countDistinctVisitors(start, end, path),
    countDistinctVisitors(previousStart, previousEnd, path),
    events.countDocuments({ ...currentWindow, ...currentShares }),
    events.countDocuments({ ...previousWindow, ...previousShares }),
    events
      .aggregate<{ _id: string; views: number; visitors: string[] }>([
        { $match: { ...currentWindow, name: "page_view", path } },
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
      .toArray(),
    events
      .aggregate<{ _id: string; shares: number }>([
        { $match: { ...currentWindow, ...currentShares } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: MONGO_DATE_FORMAT[granularity],
                date: "$timestamp",
              },
            },
            shares: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    events
      .aggregate<{ _id: string; shares: number }>([
        { $match: { ...currentWindow, ...currentShares } },
        {
          $group: {
            _id: { $ifNull: ["$properties.channel", "other"] },
            shares: { $sum: 1 },
          },
        },
        { $sort: { shares: -1 } },
      ])
      .toArray(),
  ]);

  const viewsByBucket = new Map(viewRows.map((row) => [row._id, row]));
  const sharesByBucket = new Map(shareRows.map((row) => [row._id, row.shares]));
  const traffic = emptyAnalyticsBuckets(start, end, granularity).map((bucket) => ({
    bucket,
    views: viewsByBucket.get(bucket)?.views ?? 0,
    visitors: viewsByBucket.get(bucket)?.visitors.filter(Boolean).length ?? 0,
    shares: sharesByBucket.get(bucket) ?? 0,
  }));

  return {
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
      granularity,
    },
    kind,
    slug,
    kpis: {
      views: { value: views, previous: viewsBefore },
      visitors: { value: visitors, previous: visitorsBefore },
      shares: { value: shares, previous: sharesBefore },
    },
    traffic,
    shareChannels: shareChannels.map((row) => ({
      channel: row._id,
      shares: row.shares,
    })),
  };
}

export async function getContentPerformance(input: {
  start: Date;
  end: Date;
}): Promise<ContentPerformanceItem[]> {
  const events = await getUiEventsCollection();
  const window = publicWindow(input.start, input.end);

  const [viewRows, openRows, shareRows, projects, notes] = await Promise.all([
    events
      .aggregate<{ _id: string; views: number; visitors: string[] }>([
        {
          $match: {
            ...window,
            name: "page_view",
            path: { $regex: "^/(projects|notes)/[^/?#]+$" },
          },
        },
        {
          $group: {
            _id: "$path",
            views: { $sum: 1 },
            visitors: { $addToSet: "$sessionId" },
          },
        },
      ])
      .toArray(),
    events
      .aggregate<{
        _id: { kind: ContentAnalyticsKind; slug: string };
        title: string;
      }>([
        {
          $match: {
            "actor.type": "public",
            name: { $in: ["project_open", "note_open"] },
            "properties.slug": { $nin: [null, ""] },
          },
        },
        { $sort: { timestamp: 1 } },
        {
          $group: {
            _id: {
              kind: {
                $cond: [
                  { $eq: ["$name", "project_open"] },
                  "project",
                  "note",
                ],
              },
              slug: "$properties.slug",
            },
            title: { $last: "$properties.title" },
          },
        },
      ])
      .toArray(),
    events
      .aggregate<{
        _id: { kind: ContentAnalyticsKind; slug: string };
        shares: number;
      }>([
        {
          $match: {
            ...window,
            name: { $in: ["content_share", "note_share"] },
            "properties.slug": { $nin: [null, ""] },
          },
        },
        {
          $group: {
            _id: {
              kind: {
                $cond: [
                  { $eq: ["$name", "note_share"] },
                  "note",
                  "$properties.kind",
                ],
              },
              slug: "$properties.slug",
            },
            shares: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    getProjectsCollection().then((collection) =>
      collection
        .find({}, { projection: { _id: 1, slug: 1, title: 1 } })
        .toArray(),
    ),
    getNotesCollection().then((collection) =>
      collection
        .find({}, { projection: { _id: 1, slug: 1, title: 1 } })
        .toArray(),
    ),
  ]);

  const metadata = new Map<string, { itemId: string; title: string }>();
  for (const project of projects) {
    const slug = project.slug || project._id?.toString();
    if (slug) {
      metadata.set(`project:${slug}`, {
        itemId: project._id?.toString() ?? "",
        title: project.title,
      });
    }
  }
  for (const note of notes) {
    const slug = note.slug || note._id?.toString();
    if (slug) {
      metadata.set(`note:${slug}`, {
        itemId: note._id?.toString() ?? "",
        title: note.title,
      });
    }
  }

  const shares = new Map(
    shareRows
      .filter((row) => row._id.kind && row._id.slug)
      .map((row) => [`${row._id.kind}:${row._id.slug}`, row.shares]),
  );
  const historicalTitles = new Map(
    openRows
      .filter((row) => row._id.kind && row._id.slug && row.title)
      .map((row) => [`${row._id.kind}:${row._id.slug}`, row.title]),
  );

  const items: ContentPerformanceItem[] = [];
  for (const row of viewRows) {
    const match = /^\/(projects|notes)\/([^/?#]+)$/.exec(row._id);
    if (!match) continue;
    const kind: ContentAnalyticsKind =
      match[1] === "projects" ? "project" : "note";
    const slug = decodeURIComponent(match[2]);
    const key = `${kind}:${slug}`;
    const item = metadata.get(key);

    items.push({
      kind,
      ...(item?.itemId ? { itemId: item.itemId } : {}),
      slug,
      title: item?.title || historicalTitles.get(key) || slug,
      views: row.views,
      visitors: row.visitors.filter(Boolean).length,
      shares: shares.get(key) ?? 0,
    });
  }

  return items.sort((a, b) => b.views - a.views).slice(0, 12);
}
