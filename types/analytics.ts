export type InsightsGranularity = "hour" | "day" | "month";

/** A headline number and the same number over the preceding period. */
export interface InsightMetric {
  value: number;
  previous: number;
}

export type ContentAnalyticsKind = "project" | "note";

export interface ContentPerformanceItem {
  kind: ContentAnalyticsKind;
  itemId?: string;
  slug: string;
  title: string;
  views: number;
  visitors: number;
  shares: number;
}

export interface ContentInsights {
  range: { start: string; end: string; granularity: InsightsGranularity };
  kind: ContentAnalyticsKind;
  slug: string;
  kpis: {
    views: InsightMetric;
    visitors: InsightMetric;
    shares: InsightMetric;
  };
  traffic: {
    bucket: string;
    views: number;
    visitors: number;
    shares: number;
  }[];
  shareChannels: { channel: string; shares: number }[];
}

export interface AdminInsights {
  range: { start: string; end: string; granularity: InsightsGranularity };
  kpis: {
    visitors: InsightMetric;
    pageViews: InsightMetric;
    conversations: InsightMetric;
    resumeDownloads: InsightMetric;
  };
  traffic: { bucket: string; visitors: number; views: number }[];
  content: ContentPerformanceItem[];
  pages: { path: string; views: number; visitors: number }[];
  referrers: { source: string; visitors: number }[];
  engagement: {
    chatOpened: number;
    chatSubmitted: number;
    outboundClicks: number;
    shares: number;
  };
  questions: {
    conversationId: string;
    at: string;
    question: string;
    failed: boolean;
  }[];
  health: {
    requests: number;
    errors: number;
    errorRate: number;
    slowest: { route: string; p95: number }[];
  };
}
