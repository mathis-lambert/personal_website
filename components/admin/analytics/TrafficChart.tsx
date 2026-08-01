"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { analyticsBucketLabel } from "@/lib/analytics/range";
import {
  ChartContainer,
  ChartEmptyState,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { InsightsGranularity } from "@/types/analytics";

const TRAFFIC_CHART_CONFIG = {
  views: { label: "Page views", color: "var(--ink-azure)" },
  visitors: { label: "Visitors", color: "var(--ink-coral)" },
};

type ChartPoint = {
  bucket: string;
  label: string;
  views: number;
  visitors: number;
};

function SingleMetricChart({
  data,
  dataKey,
  color,
}: {
  data: ChartPoint[];
  dataKey: "views" | "visitors";
  color: string;
}) {
  return (
    <ChartContainer
      config={TRAFFIC_CHART_CONFIG}
      className="h-[210px] w-full"
      initialDimension={{ width: 520, height: 210 }}
    >
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          minTickGap={34}
          tick={{ fontSize: 10 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
          tick={{ fontSize: 10 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={0.1}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function TrafficChart({
  points,
  granularity,
  compact = false,
}: {
  points: { bucket: string; views: number; visitors: number }[];
  granularity: InsightsGranularity;
  compact?: boolean;
}) {
  const data = points.map((point) => ({
    ...point,
    label: analyticsBucketLabel(point.bucket, granularity),
  }));

  if (data.every((point) => point.views === 0)) {
    return <ChartEmptyState message="No visits in this range" />;
  }

  const maxViews = Math.max(...data.map((point) => point.views), 0);
  const maxVisitors = Math.max(...data.map((point) => point.visitors), 0);
  const splitScales = !compact && maxVisitors > 0 && maxViews / maxVisitors > 8;

  if (splitScales) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h3 className="t-meta mb-1 text-ink-faint">Page views</h3>
          <SingleMetricChart
            data={data}
            dataKey="views"
            color="var(--ink-azure)"
          />
        </section>
        <section>
          <h3 className="t-meta mb-1 text-ink-faint">Visitors</h3>
          <SingleMetricChart
            data={data}
            dataKey="visitors"
            color="var(--ink-coral)"
          />
        </section>
      </div>
    );
  }

  return (
    <ChartContainer
      config={TRAFFIC_CHART_CONFIG}
      className={compact ? "h-[180px] w-full" : "h-[280px] w-full"}
      initialDimension={compact ? { width: 280, height: 180 } : undefined}
    >
      <AreaChart
        data={data}
        margin={{ left: compact ? -24 : 4, right: 8, top: 8, bottom: 0 }}
      >
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          minTickGap={compact ? 38 : 28}
          tick={{ fontSize: 10 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
          tick={{ fontSize: 10 }}
          hide={compact}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="views"
          stroke="var(--ink-azure)"
          strokeWidth={2}
          fill="var(--ink-azure)"
          fillOpacity={0.1}
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
  );
}
