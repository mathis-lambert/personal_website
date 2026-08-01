import {
  MetricDelta,
  MetricSparkline,
} from "@/components/admin/shared/StatStrip";
import type { ContentInsights } from "@/types/analytics";

export function ContentKpiGrid({ data }: { data: ContentInsights }) {
  const metrics = [
    {
      label: "Views",
      metric: data.kpis.views,
      series: data.traffic.map((point) => point.views),
    },
    {
      label: "Visitors",
      metric: data.kpis.visitors,
      series: data.traffic.map((point) => point.visitors),
    },
    {
      label: "Shares",
      metric: data.kpis.shares,
      series: data.traffic.map((point) => point.shares),
    },
  ];

  return (
    <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-3 border border-line bg-line">
      {metrics.map((item) => (
        <div key={item.label} className="min-w-0 bg-paper-lift px-2.5 py-3">
          <dt className="truncate font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-ink-faint">
            {item.label}
          </dt>
          <dd>
            <p className="mt-2 font-mono text-[1.45rem] font-semibold leading-none tracking-[-0.04em] text-ink tabular-nums">
              {item.metric.value.toLocaleString("en-GB")}
            </p>
            <div className="mt-1.5">
              <MetricDelta {...item.metric} compact />
            </div>
            <MetricSparkline values={item.series} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
