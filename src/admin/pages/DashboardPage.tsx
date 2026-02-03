"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/admin/providers/AdminAuthProvider";
import {
  getCollectionData,
  getEventsAnalytics,
  getEventsList,
} from "@/api/admin";
import type {
  Article,
  Project,
  EventsAnalyticsResponse,
  EventsListResponse,
} from "@/types";
import type { TimelineData } from "@/components/ui/ScrollableTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, RefreshCw } from "lucide-react";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartEmptyState,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DashboardPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [counts, setCounts] = useState<{ [k: string]: number }>({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [errCounts, setErrCounts] = useState<string | null>(null);

  // Analytics state
  type Preset = "7d" | "30d" | "90d" | "custom";
  const [preset, setPreset] = useState<Preset>("7d");
  const [customStart, setCustomStart] = useState<string>(""); // yyyy-mm-dd
  const [customEnd, setCustomEnd] = useState<string>(""); // yyyy-mm-dd
  const [analytics, setAnalytics] = useState<EventsAnalyticsResponse | null>(
    null,
  );
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [errAnalytics, setErrAnalytics] = useState<string | null>(null);
  const [refreshTs, setRefreshTs] = useState(0);
  // Activity (agent_completion) state
  const [chatSeries, setChatSeries] = useState<EventsAnalyticsResponse | null>(
    null,
  );
  const [chatLocations, setChatLocations] =
    useState<EventsAnalyticsResponse | null>(null);
  const [events, setEvents] = useState<EventsListResponse | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [errActivity, setErrActivity] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const ac = new AbortController();
    async function loadCounts() {
      if (!token) return;
      setLoadingCounts(true);
      setErrCounts(null);
      try {
        const [projects, articles, experiences, studies] = await Promise.all([
          getCollectionData<Project[]>("projects", token),
          getCollectionData<Article[]>("articles", token),
          getCollectionData<TimelineData[]>("experiences", token),
          getCollectionData<TimelineData[]>("studies", token),
        ]);
        if (!canceled)
          setCounts({
            projects: Array.isArray(projects) ? projects.length : 0,
            articles: Array.isArray(articles) ? articles.length : 0,
            experiences: Array.isArray(experiences) ? experiences.length : 0,
            studies: Array.isArray(studies) ? studies.length : 0,
          });
      } catch (e) {
        if (!canceled) setErrCounts((e as Error)?.message ?? "Failed to load");
      } finally {
        if (!canceled) setLoadingCounts(false);
      }
    }
    void loadCounts();
    return () => {
      canceled = true;
      ac.abort();
    };
  }, [token]);

  // Compute current range and granularity
  const { startIso, endIso, granularity } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    if (preset === "7d") start.setDate(now.getDate() - 7);
    else if (preset === "30d") start.setDate(now.getDate() - 30);
    else if (preset === "90d") start.setDate(now.getDate() - 90);
    else {
      // custom
      const s = customStart
        ? new Date(customStart + "T00:00:00Z")
        : new Date(now.getTime() - 7 * 86400000);
      const e = customEnd ? new Date(customEnd + "T23:59:59Z") : now;
      start = s;
      now.setTime(e.getTime());
    }
    const ms = now.getTime() - start.getTime();
    const days = ms / 86400000;
    let g: "hour" | "day" | "month" = "day";
    if (days <= 3) g = "hour";
    else if (days > 180) g = "month";
    const startIso = start.toISOString();
    const endIso = now.toISOString();
    return { startIso, endIso, granularity: g };
  }, [preset, customStart, customEnd]);

  // Load analytics
  useEffect(() => {
    let canceled = false;
    if (!token) return;
    setLoadingAnalytics(true);
    setErrAnalytics(null);
    getEventsAnalytics({ start: startIso, end: endIso, granularity }, token)
      .then((res) => {
        if (!canceled) setAnalytics(res);
      })
      .catch((e) => {
        if (!canceled)
          setErrAnalytics((e as Error)?.message ?? "Failed to load analytics");
      })
      .finally(() => {
        if (!canceled) setLoadingAnalytics(false);
      });
    return () => {
      canceled = true;
    };
    // refreshTs to allow manual refresh
  }, [token, startIso, endIso, granularity, refreshTs]);

  const actions = analytics?.actions ?? [];

  // Load chat activity (series + locations + recent events)
  useEffect(() => {
    let canceled = false;
    if (!token) return;
    setLoadingActivity(true);
    setErrActivity(null);
    Promise.all([
      getEventsAnalytics(
        {
          start: startIso,
          end: endIso,
          granularity,
          actions: ["agent_completion"],
        },
        token,
      ),
      getEventsAnalytics(
        {
          start: startIso,
          end: endIso,
          granularity,
          actions: ["agent_completion"],
          groupBy: "location",
        },
        token,
      ),
      getEventsList(
        {
          start: startIso,
          end: endIso,
          action: "agent_completion",
          limit: 50,
          sort: "desc",
        },
        token,
      ),
    ])
      .then(([series, locations, list]) => {
        if (canceled) return;
        setChatSeries(series);
        setChatLocations(locations);
        setEvents(list);
      })
      .catch((e) => {
        if (!canceled)
          setErrActivity((e as Error)?.message ?? "Failed to load activity");
      })
      .finally(() => {
        if (!canceled) setLoadingActivity(false);
      });
    return () => {
      canceled = true;
    };
  }, [token, startIso, endIso, granularity, refreshTs]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Quick stats */}
      {loadingCounts ? (
        <div>Loading…</div>
      ) : errCounts ? (
        <div className="text-red-600">{errCounts}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(counts).map(([k, v]) => (
            <div key={k} className="rounded-lg border p-4 bg-card">
              <div className="text-sm text-muted-foreground capitalize">
                {k}
              </div>
              <div className="text-2xl font-semibold tabular-nums">{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Website Activity</CardTitle>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary">
                  Range: {preset.toUpperCase()}{" "}
                  <ChevronDown className="ml-1 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Quick ranges</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["7d", "30d", "90d"] as Preset[]).map((p) => (
                  <DropdownMenuItem key={p} onClick={() => setPreset(p)}>
                    Last {p.replace("d", " days")}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPreset("custom")}>
                  Custom…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {preset === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-8 w-[11rem]"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-8 w-[11rem]"
                />
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setRefreshTs(Date.now())}
            >
              <RefreshCw className="mr-1 size-4" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total events over time */}
          <div className="rounded-md border p-3">
            {loadingAnalytics ? (
              <ChartEmptyState message="Loading…" />
            ) : errAnalytics ? (
              <div className="text-red-600 text-sm">{errAnalytics}</div>
            ) : analytics && analytics.series.length ? (
              <ChartContainer
                config={{ total: { color: "var(--chart-1)" } }}
                className="h-[260px] w-full"
              >
                <ResponsiveContainer>
                  <AreaChart
                    data={analytics.series}
                    margin={{ left: 8, right: 12, top: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="fillTotal"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={40}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="total"
                      stroke="var(--chart-1)"
                      fill="url(#fillTotal)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>

          {/* Breakdown by action (stacked bars) */}
          <div className="rounded-md border p-3">
            {loadingAnalytics ? (
              <ChartEmptyState message="Loading…" />
            ) : errAnalytics ? (
              <div className="text-red-600 text-sm">{errAnalytics}</div>
            ) : analytics && analytics.series.length ? (
              <ChartContainer className="h-[300px] w-full">
                <ResponsiveContainer>
                  <BarChart
                    data={analytics.series}
                    margin={{ left: 8, right: 12, top: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={40}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {actions.map((a, idx) => (
                      <Bar
                        key={a}
                        dataKey={a}
                        name={a}
                        stackId="1"
                        fill={`var(--chart-${(idx % 5) + 1})`}
                        radius={2}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity: Chat Completions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">
            Activity — Chat Completions
          </CardTitle>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary">
                  Range: {preset.toUpperCase()}{" "}
                  <ChevronDown className="ml-1 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Quick ranges</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["7d", "30d", "90d"] as Preset[]).map((p) => (
                  <DropdownMenuItem key={p} onClick={() => setPreset(p)}>
                    Last {p.replace("d", " days")}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPreset("custom")}>
                  Custom…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {preset === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-8 w-[11rem]"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-8 w-[11rem]"
                />
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setRefreshTs(Date.now())}
            >
              <RefreshCw className="mr-1 size-4" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chat volume over time */}
          <div className="rounded-md border p-3">
            {loadingActivity ? (
              <ChartEmptyState message="Loading…" />
            ) : errActivity ? (
              <div className="text-red-600 text-sm">{errActivity}</div>
            ) : chatSeries && chatSeries.series.length ? (
              <ChartContainer className="h-[240px] w-full">
                <ResponsiveContainer>
                  <AreaChart
                    data={chatSeries.series}
                    margin={{ left: 8, right: 12, top: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="fillChat" x1="0" x2="0" y1="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--chart-2)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--chart-2)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={40}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="completions"
                      stroke="var(--chart-2)"
                      fill="url(#fillChat)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>

          {/* Top locations */}
          <div className="rounded-md border p-3">
            {loadingActivity ? (
              <ChartEmptyState message="Loading…" />
            ) : errActivity ? (
              <div className="text-red-600 text-sm">{errActivity}</div>
            ) : chatLocations && chatLocations.actions.length ? (
              <ChartContainer className="h-[240px] w-full">
                <ResponsiveContainer>
                  <BarChart
                    data={(() => {
                      const totals = chatLocations.totals?.byAction || {};
                      const pairs = Object.entries(totals) as Array<
                        [string, number]
                      >;
                      pairs.sort((a, b) => b[1] - a[1]);
                      const top = pairs.slice(0, 5);
                      return top.map(([name, value]) => ({
                        name: name || "unknown",
                        value,
                      }));
                    })()}
                    layout="vertical"
                    margin={{ left: 16, right: 12, top: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="value"
                      name="by location"
                      fill="var(--chart-3)"
                      radius={2}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>

          {/* Recent chat requests */}
          <div className="rounded-md border">
            <div className="px-3 py-2 border-b text-sm text-muted-foreground">
              Recent requests
            </div>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left font-normal px-3 py-2 w-[180px]">
                      Time (UTC)
                    </th>
                    <th className="text-left font-normal px-3 py-2 w-[160px]">
                      Location
                    </th>
                    <th className="text-left font-normal px-3 py-2">Prompt</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingActivity ? (
                    <tr>
                      <td className="px-3 py-3" colSpan={3}>
                        Loading…
                      </td>
                    </tr>
                  ) : errActivity ? (
                    <tr>
                      <td className="px-3 py-3 text-red-600" colSpan={3}>
                        {errActivity}
                      </td>
                    </tr>
                  ) : events && events.items.length ? (
                    events.items.map((ev, idx) => {
                      const ts = ev.created_at
                        ? new Date(ev.created_at)
                            .toISOString()
                            .replace("T", " ")
                            .replace("Z", "")
                        : "n/a";
                      const loc = ev.request_body?.location || "";
                      const messages = ev.request_body?.messages || [];
                      const last =
                        Array.isArray(messages) && messages.length
                          ? messages[messages.length - 1]
                          : null;
                      const content = last?.content ?? "";
                      return (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                            {ts}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{loc}</td>
                          <td className="px-3 py-2">
                            <div className="line-clamp-2 break-words text-foreground/90">
                              {content}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-3 py-3" colSpan={3}>
                        No requests for this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
