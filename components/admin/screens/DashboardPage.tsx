"use client";

import {
  MessageSquareText,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

import { AnalyticsRangePicker } from "@/components/admin/analytics/AnalyticsRangePicker";
import { ContentPerformanceList } from "@/components/admin/analytics/ContentPerformanceList";
import { analyticsDates } from "@/lib/analytics/range";
import { TrafficChart } from "@/components/admin/analytics/TrafficChart";
import {
  Empty,
  ErrorNote,
  LoadingRows,
  PageHeader,
  Panel,
} from "@/components/admin/shared/primitives";
import { StatStrip, type Stat } from "@/components/admin/shared/StatStrip";
import { useAdminAuth } from "@/components/admin/providers/AdminAuthProvider";
import { useAdminData } from "@/hooks/admin/useAdminData";
import { getInsights } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { formatDate, formatDurationMs, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * What happened on the site: who came, what they opened, what they asked,
 * whether anything is broken. Infrastructure is one line at the bottom.
 */
const DashboardPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [days, setDays] = useState<number>(30);

  const load = useMemo(() => {
    if (!token) return null;
    const range = analyticsDates(days);
    return (signal: AbortSignal) =>
      getInsights(range, { token, signal });
  }, [token, days]);

  const { data, error, loading, reload } = useAdminData(load);

  const stats: Stat[] = useMemo(() => {
    if (!data) return [];
    const views = data.traffic.map((point) => point.views);
    const visitors = data.traffic.map((point) => point.visitors);
    return [
      {
        label: "Visitors",
        metric: data.kpis.visitors,
        ink: "azure",
        series: visitors,
      },
      {
        label: "Page views",
        metric: data.kpis.pageViews,
        ink: "azure",
        series: views,
      },
      {
        label: "Conversations",
        metric: data.kpis.conversations,
        ink: "coral",
        series: [],
      },
      {
        label: "Resume downloads",
        metric: data.kpis.resumeDownloads,
        ink: "turquoise",
        series: [],
      },
    ];
  }, [data]);

  const askRate = data?.engagement.chatOpened
    ? data.engagement.chatSubmitted / data.engagement.chatOpened
    : 0;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Who visited, what they opened, and what they asked."
        actions={
          <>
            <AnalyticsRangePicker days={days} onChange={setDays} />
            <Button
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={loading}
            >
              <RefreshCw className={cn(loading && "animate-spin")} />
              Refresh
            </Button>
          </>
        }
      />

      {error ? <ErrorNote message={error} /> : null}

      {loading && !data ? (
        <LoadingRows rows={6} />
      ) : data ? (
        <div className="flex flex-col gap-9">
          <StatStrip stats={stats} />

          <Panel title="Traffic" hint={`by ${data.range.granularity}`}>
            <TrafficChart
              points={data.traffic}
              granularity={data.range.granularity}
            />
          </Panel>

          <div className="grid gap-9 lg:grid-cols-2">
            <Panel title="Content performance" hint="views · visitors · shares">
              {data.content.length === 0 ? (
                <Empty
                  title="No content visits yet."
                  hint="Projects and notes appear here after their first public visit."
                />
              ) : (
                <ContentPerformanceList items={data.content} />
              )}
            </Panel>

            <Panel
              title="What people asked"
              hint={`${Math.round(askRate * 100)}% of opens became a question`}
              actions={
                <Link
                  href="/admin/discussions"
                  className="t-meta text-brand no-underline hover:underline"
                >
                  All
                </Link>
              }
            >
              {data.questions.length === 0 ? (
                <Empty
                  title="No questions yet."
                  hint="Anything a visitor types into the site assistant shows up here."
                />
              ) : (
                <ul className="divide-y divide-line">
                  {data.questions.map((item) => (
                    <li
                      key={`${item.conversationId}-${item.at}`}
                      className="py-2.5"
                    >
                      <p className="text-sm leading-snug text-ink">
                        {item.question}
                      </p>
                      <p className="t-meta mt-1 text-ink-faint">
                        {formatDate(item.at, "short")}
                        {item.failed ? (
                          <span className="ml-2 text-destructive">failed</span>
                        ) : null}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Pages" hint="views · visitors">
              <ol className="divide-y divide-line">
                {data.pages.map((page) => (
                  <li key={page.path} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1 truncate font-mono text-[0.75rem] text-ink">
                      {page.path}
                    </span>
                    <span className="t-meta shrink-0 tabular-nums text-ink">
                      {page.views}
                    </span>
                    <span className="t-meta w-8 shrink-0 text-right tabular-nums text-ink-faint">
                      {page.visitors}
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel title="Referrers" hint="visitors">
              {data.referrers.length === 0 ? (
                <Empty
                  title="No referrers recorded."
                  hint="Visitors arriving from a link elsewhere will be listed here."
                />
              ) : (
                <ol className="divide-y divide-line">
                  {data.referrers.map((referrer) => (
                    <li
                      key={referrer.source}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        {referrer.source}
                      </span>
                      <span className="t-meta shrink-0 tabular-nums text-ink">
                        {referrer.visitors}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>

          {/* Infrastructure, deliberately last and deliberately one line. It only
              earns attention when the error count stops being zero. */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4">
            <span className="t-eyebrow text-ink-faint">Health</span>
            <span className="t-meta text-ink">
              {data.health.requests.toLocaleString("en-GB")} requests
            </span>
            <span
              className={cn(
                "t-meta",
                data.health.errors > 0 ? "text-destructive" : "text-ink-muted",
              )}
            >
              {data.health.errors} errors
              {data.health.errors > 0
                ? ` · ${formatPercent(data.health.errorRate)}`
                : ""}
            </span>
            {data.health.slowest[0] ? (
              <span className="t-meta text-ink-muted">
                slowest {data.health.slowest[0].route}{" "}
                {formatDurationMs(data.health.slowest[0].p95)} p95
              </span>
            ) : null}
            <Link
              href="/admin/discussions"
              className="t-meta ml-auto inline-flex items-center gap-1 text-brand no-underline hover:underline"
            >
              <MessageSquareText className="size-3" />
              Conversation log
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default DashboardPage;
