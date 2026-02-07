"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAdminAuth } from "@/admin/providers/AdminAuthProvider";
import {
  getCollectionData,
  getAnalyticsActivity,
  getAnalyticsEndpoints,
  getAnalyticsErrors,
  getAnalyticsOverview,
  getAnalyticsTimeseries,
} from "@/api/admin";
import type {
  AdminAnalyticsActivityResponse,
  AdminAnalyticsEndpointsResponse,
  AdminAnalyticsErrorsResponse,
  AdminAnalyticsOverviewResponse,
  AdminAnalyticsTimeseriesResponse,
  AnalyticsGranularity,
  Article,
  Project,
} from "@/types";
import type { TimelineData } from "@/components/ui/ScrollableTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChartContainer,
  ChartEmptyState,
  ChartTooltipContent,
} from "@/components/ui/chart";

type Preset = "7d" | "30d" | "90d" | "custom";

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const formatMs = (value: number) => `${Math.round(value)} ms`;

const DashboardPage: React.FC = () => {
  const { token } = useAdminAuth();

  const [contentCounts, setContentCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [countsError, setCountsError] = useState<string | null>(null);

  const [preset, setPreset] = useState<Preset>("7d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [actorType, setActorType] = useState<"" | "public" | "admin">("");

  const [overview, setOverview] =
    useState<AdminAnalyticsOverviewResponse | null>(null);
  const [timeseries, setTimeseries] =
    useState<AdminAnalyticsTimeseriesResponse | null>(null);
  const [endpoints, setEndpoints] =
    useState<AdminAnalyticsEndpointsResponse | null>(null);
  const [errors, setErrors] = useState<AdminAnalyticsErrorsResponse | null>(null);
  const [activity, setActivity] =
    useState<AdminAnalyticsActivityResponse | null>(null);

  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let canceled = false;

    const loadCounts = async () => {
      if (!token) return;
      setLoadingCounts(true);
      setCountsError(null);
      try {
        const [projects, articles, experiences, studies] = await Promise.all([
          getCollectionData<Project[]>("projects", token),
          getCollectionData<Article[]>("articles", token),
          getCollectionData<TimelineData[]>("experiences", token),
          getCollectionData<TimelineData[]>("studies", token),
        ]);
        if (canceled) return;
        setContentCounts({
          projects: Array.isArray(projects) ? projects.length : 0,
          articles: Array.isArray(articles) ? articles.length : 0,
          experiences: Array.isArray(experiences) ? experiences.length : 0,
          studies: Array.isArray(studies) ? studies.length : 0,
        });
      } catch (error) {
        if (!canceled) {
          setCountsError((error as Error).message || "Failed to load content counts");
        }
      } finally {
        if (!canceled) {
          setLoadingCounts(false);
        }
      }
    };

    void loadCounts();

    return () => {
      canceled = true;
    };
  }, [token]);

  const { startIso, endIso, granularity } = useMemo(() => {
    const now = new Date();
    let start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let end = new Date(now);

    if (preset === "30d") {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (preset === "90d") {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (preset === "custom") {
      if (customStart) {
        start = new Date(`${customStart}T00:00:00.000Z`);
      }
      if (customEnd) {
        end = new Date(`${customEnd}T23:59:59.999Z`);
      }
    }

    const diffDays = clamp((end.getTime() - start.getTime()) / 86400000, 0, 3650);

    let resolvedGranularity: AnalyticsGranularity = "day";
    if (diffDays <= 3) resolvedGranularity = "hour";
    if (diffDays > 180) resolvedGranularity = "month";

    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      granularity: resolvedGranularity,
    };
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    let canceled = false;

    const loadAnalytics = async () => {
      if (!token) return;
      setLoadingAnalytics(true);
      setAnalyticsError(null);

      try {
        const common = {
          start: startIso,
          end: endIso,
          route: routeFilter || undefined,
          method: methodFilter || undefined,
          actorType: actorType || undefined,
        };

        const [overviewData, timeseriesData, endpointsData, errorsData, activityData] =
          await Promise.all([
            getAnalyticsOverview(common, token),
            getAnalyticsTimeseries({ ...common, granularity }, token),
            getAnalyticsEndpoints({ ...common, limit: 20 }, token),
            getAnalyticsErrors({ ...common, limit: 30 }, token),
            getAnalyticsActivity({ ...common, type: "all", limit: 80 }, token),
          ]);

        if (canceled) return;

        setOverview(overviewData);
        setTimeseries(timeseriesData);
        setEndpoints(endpointsData);
        setErrors(errorsData);
        setActivity(activityData);
      } catch (error) {
        if (!canceled) {
          setAnalyticsError((error as Error).message || "Failed to load analytics");
        }
      } finally {
        if (!canceled) {
          setLoadingAnalytics(false);
        }
      }
    };

    void loadAnalytics();

    return () => {
      canceled = true;
    };
  }, [
    token,
    startIso,
    endIso,
    granularity,
    routeFilter,
    methodFilter,
    actorType,
    refreshKey,
  ]);

  const summary = overview?.summary;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Analytics Filters</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRefreshKey(Date.now())}
          >
            <RefreshCw className="mr-1 size-4" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["7d", "30d", "90d", "custom"] as Preset[]).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={preset === value ? "default" : "secondary"}
                onClick={() => setPreset(value)}
              >
                {value === "custom" ? "Custom" : `Last ${value.replace("d", " days")}`}
              </Button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-[12rem]"
              />
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-[12rem]"
              />
            </div>
          )}

          <div className="grid gap-2 md:grid-cols-3">
            <Input
              placeholder="Filter route (exact)"
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
            />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">All methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <select
              value={actorType}
              onChange={(e) => setActorType(e.target.value as "" | "public" | "admin")}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">All actors</option>
              <option value="public">Public</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            Range uses {granularity} granularity ({startIso} → {endIso})
          </p>
        </CardContent>
      </Card>

      {loadingCounts ? (
        <div>Loading content stats…</div>
      ) : countsError ? (
        <div className="text-red-600">{countsError}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(contentCounts).map(([key, value]) => (
            <div key={key} className="rounded-lg border bg-card p-4">
              <div className="text-sm capitalize text-muted-foreground">{key}</div>
              <div className="text-2xl font-semibold tabular-nums">{value}</div>
            </div>
          ))}
        </div>
      )}

      {loadingAnalytics ? (
        <div>Loading analytics…</div>
      ) : analyticsError ? (
        <div className="text-red-600">{analyticsError}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Total requests</div>
              <div className="text-2xl font-semibold tabular-nums">
                {summary?.totalRequests ?? 0}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Error rate</div>
              <div className="text-2xl font-semibold tabular-nums">
                {formatPercent(summary?.errorRate ?? 0)}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">P95 latency</div>
              <div className="text-2xl font-semibold tabular-nums">
                {formatMs(summary?.p95LatencyMs ?? 0)}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">UI events</div>
              <div className="text-2xl font-semibold tabular-nums">
                {summary?.uiEvents ?? 0}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Unique routes</div>
              <div className="text-2xl font-semibold tabular-nums">
                {summary?.uniqueRoutes ?? 0}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Unique visitors</div>
              <div className="text-2xl font-semibold tabular-nums">
                {summary?.uniqueVisitors ?? 0}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Average latency</div>
              <div className="text-2xl font-semibold tabular-nums">
                {formatMs(summary?.avgLatencyMs ?? 0)}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Error requests</div>
              <div className="text-2xl font-semibold tabular-nums">
                {summary?.errorRequests ?? 0}
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Traffic and Errors Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {!timeseries?.series.length ? (
                <ChartEmptyState message="No data for this filter range." />
              ) : (
                <ChartContainer className="h-[300px] w-full">
                  <ResponsiveContainer>
                    <LineChart data={timeseries.series} margin={{ left: 8, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="bucket" tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="requests"
                        name="Requests"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="errors"
                        name="Errors"
                        stroke="var(--chart-3)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="uiEvents"
                        name="UI events"
                        stroke="var(--chart-2)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="px-2 py-2 text-left font-normal">Route</th>
                    <th className="px-2 py-2 text-left font-normal">Method</th>
                    <th className="px-2 py-2 text-right font-normal">Count</th>
                    <th className="px-2 py-2 text-right font-normal">Error rate</th>
                    <th className="px-2 py-2 text-right font-normal">P50</th>
                    <th className="px-2 py-2 text-right font-normal">P95</th>
                    <th className="px-2 py-2 text-right font-normal">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoints?.items.length ? (
                    endpoints.items.map((item) => (
                      <tr key={`${item.route}:${item.method}`} className="border-b last:border-0">
                        <td className="px-2 py-2">{item.route}</td>
                        <td className="px-2 py-2">{item.method}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{item.count}</td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {formatPercent(item.errorRate)}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {formatMs(item.p50LatencyMs)}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {formatMs(item.p95LatencyMs)}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {new Date(item.lastSeenAt).toISOString().replace("T", " ").slice(0, 19)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-2 py-3" colSpan={7}>
                        No endpoint data for current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Errors</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="px-2 py-2 text-left font-normal">Time (UTC)</th>
                      <th className="px-2 py-2 text-left font-normal">Route</th>
                      <th className="px-2 py-2 text-right font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors?.items.length ? (
                      errors.items.map((item, idx) => (
                        <tr key={`${item.timestamp}-${idx}`} className="border-b last:border-0">
                          <td className="px-2 py-2 tabular-nums">
                            {new Date(item.timestamp).toISOString().replace("T", " ").slice(0, 19)}
                          </td>
                          <td className="px-2 py-2">
                            <div className="font-medium">{item.route}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.method} • {item.actorType} • {item.durationMs} ms
                            </div>
                            {item.message && (
                              <div className="mt-1 text-xs text-red-600 line-clamp-2">{item.message}</div>
                            )}
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums">{item.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-2 py-3" colSpan={3}>
                          No errors in this range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity Feed</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="px-2 py-2 text-left font-normal">Time (UTC)</th>
                      <th className="px-2 py-2 text-left font-normal">Type</th>
                      <th className="px-2 py-2 text-left font-normal">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity?.items.length ? (
                      activity.items.map((item, idx) => (
                        <tr key={`${item.timestamp}-${idx}`} className="border-b last:border-0">
                          <td className="px-2 py-2 tabular-nums whitespace-nowrap">
                            {new Date(item.timestamp).toISOString().replace("T", " ").slice(0, 19)}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            {item.kind === "api_request" ? "API" : "UI"}
                          </td>
                          <td className="px-2 py-2">
                            {item.kind === "api_request" ? (
                              <>
                                <div className="font-medium">
                                  {item.method} {item.route}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  status {item.status} • {item.durationMs} ms • {item.actorType}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.path || "n/a"} • {item.actorType}
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-2 py-3" colSpan={3}>
                          No activity in this range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
