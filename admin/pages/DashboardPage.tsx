"use client";

import {
  ArrowUpRight,
  FileText,
  FolderKanban,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Empty,
  ErrorNote,
  LoadingRows,
  PageHeader,
  Panel,
} from "@/admin/components/primitives";
import { StatStrip, type Stat } from "@/admin/components/StatStrip";
import { useAdminAuth } from "@/admin/providers/AdminAuthProvider";
import { useAdminData } from "@/admin/useAdminData";
import { getInsights } from "@/api/admin";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatDate, formatDurationMs, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

const CHART_CONFIG = {
  views: { label: "Page views", color: "var(--ink-azure)" },
  visitors: { label: "Visitors", color: "var(--ink-coral)" },
};

/** Bucket keys are ISO prefixes; show only the part that varies across a range. */
const bucketLabel = (bucket: string, granularity: string) => {
  if (granularity === "hour") return `${bucket.slice(11, 13)}:00`;
  if (granularity === "month") return bucket;
  return formatDate(`${bucket}T00:00:00.000Z`, "short").replace(/ \d{4}$/, "");
};

/**
 * What happened on the site.
 *
 * This screen used to be an APM console: request volume, error rate, p50 and p95
 * latency, endpoints ranked by throughput. For a portfolio with a handful of
 * visitors and no error budget, none of that is a decision anyone makes. It
 * answers the four questions the owner actually has, in that order: did anyone
 * come, what did they read, did they reach out, is anything broken.
 * Infrastructure is one line at the bottom.
 */
const DashboardPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [days, setDays] = useState<number>(30);

  const load = useMemo(() => {
    if (!token) return null;
    const end = new Date();
    const start = new Date(end.getTime() - days * 86_400_000);
    return (signal: AbortSignal) =>
      getInsights(
        { start: start.toISOString(), end: end.toISOString() },
        { token, signal },
      );
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

  const chartData = useMemo(
    () =>
      data?.traffic.map((point) => ({
        ...point,
        label: bucketLabel(point.bucket, data.range.granularity),
      })) ?? [],
    [data],
  );

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
            <div
              role="group"
              aria-label="Date range"
              className="inline-flex rounded-full border border-line p-1"
            >
              {RANGES.map((range) => (
                <button
                  key={range.label}
                  type="button"
                  onClick={() => setDays(range.days)}
                  aria-pressed={days === range.days}
                  className={cn(
                    "rounded-full px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-wider transition-colors",
                    days === range.days
                      ? "bg-ink text-ink-invert"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
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
            {chartData.every((point) => point.views === 0) ? (
              <Empty
                title="No visits in this range."
                hint="Try a longer range, or check back once the site has had traffic."
              />
            ) : (
              <ChartContainer
                config={CHART_CONFIG}
                className="h-[280px] w-full"
              >
                <AreaChart
                  data={chartData}
                  margin={{ left: 4, right: 8, top: 8 }}
                >
                  <defs>
                    <linearGradient id="fill-views" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--ink-azure)"
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--ink-azure)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={28}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={32}
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="var(--ink-azure)"
                    strokeWidth={2}
                    fill="url(#fill-views)"
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="var(--ink-coral)"
                    strokeWidth={2}
                    fill="none"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </Panel>

          <div className="grid gap-9 lg:grid-cols-2">
            <Panel title="Most opened" hint="projects and notes">
              {data.content.length === 0 ? (
                <Empty
                  title="Nothing opened yet."
                  hint="Counts appear once a visitor opens a project or a note."
                />
              ) : (
                <ol className="divide-y divide-line">
                  {data.content.map((item) => (
                    <li
                      key={`${item.kind}-${item.slug}`}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <span
                        aria-hidden="true"
                        className="text-ink-faint [&_svg]:size-3.5"
                      >
                        {item.kind === "project" ? (
                          <FolderKanban />
                        ) : (
                          <FileText />
                        )}
                      </span>
                      <Link
                        href={`/${item.kind === "project" ? "projects" : "notes"}/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="group min-w-0 flex-1 truncate text-sm font-bold text-ink no-underline hover:text-brand"
                      >
                        {item.title}
                        <ArrowUpRight className="ml-1 inline size-3 text-ink-faint transition-colors group-hover:text-brand" />
                      </Link>
                      <span className="t-meta shrink-0 tabular-nums text-ink">
                        {item.opens}
                      </span>
                    </li>
                  ))}
                </ol>
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
