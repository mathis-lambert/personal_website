"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import type { InsightMetric } from "@/types";
import { cn } from "@/lib/utils";

export type Stat = {
  label: string;
  metric: InsightMetric;
  /** What one unit is, so "5" is never ambiguous. */
  unit?: string;
  ink: string;
  /** Values per bucket, drawn as a sparkline behind the number. */
  series: number[];
};

/** A sparkline as a single filled path. No axes, no library, no tooltip. */
function Spark({ values }: { values: number[] }) {
  if (values.length < 2 || values.every((value) => value === 0)) return null;

  const max = Math.max(...values);
  const step = 100 / (values.length - 1);
  const points = values.map(
    (value, index) => `${index * step},${28 - (value / max) * 24}`,
  );

  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="mt-3 h-7 w-full text-brand"
    >
      <polygon
        points={`0,28 ${points.join(" ")} 100,28`}
        fill="currentColor"
        opacity="0.12"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * The change against the preceding period of the same length.
 *
 * A bare count answers "how many" and stops there. Whether it is more or less
 * than last week is the part that makes you do something, so it sits with the
 * number rather than in a tooltip.
 */
function Delta({ value, previous }: InsightMetric) {
  if (previous === 0) {
    return (
      <span className="t-meta text-ink-faint">
        {value > 0 ? "first in this range" : "nothing yet"}
      </span>
    );
  }

  const change = Math.round(((value - previous) / previous) * 100);
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  return (
    <span
      className={cn(
        "t-meta inline-flex items-center gap-1",
        change > 0 && "text-brand",
        change < 0 && "text-ink-muted",
        change === 0 && "text-ink-faint",
      )}
    >
      <Icon className="size-3" />
      {change > 0 ? "+" : ""}
      {change}% vs previous
    </span>
  );
}

/**
 * The four numbers worth reading first, across the top.
 *
 * Hairline cells rather than four cards: they are one instrument reading, not
 * four separate objects, and the shared baseline makes them comparable at a
 * glance.
 */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3 border border-line bg-line lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} data-ink={stat.ink} className="bg-paper-lift p-4">
          <dt className="t-eyebrow text-ink-faint">{stat.label}</dt>
          <dd>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-ink tabular-nums">
                {stat.metric.value.toLocaleString("en-GB")}
              </span>
              {stat.unit ? (
                <span className="t-meta text-ink-faint">{stat.unit}</span>
              ) : null}
            </div>
            <div className="mt-2">
              <Delta {...stat.metric} />
            </div>
            <Spark values={stat.series} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
