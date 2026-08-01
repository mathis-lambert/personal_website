"use client";

import { ANALYTICS_RANGES } from "@/lib/analytics/range";
import { cn } from "@/lib/utils";

export function AnalyticsRangePicker({
  days,
  onChange,
  compact = false,
}: {
  days: number;
  onChange: (days: number) => void;
  compact?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Date range"
      className="inline-flex rounded-full border border-line p-1"
    >
      {ANALYTICS_RANGES.map((range) => (
        <button
          key={range.label}
          type="button"
          onClick={() => onChange(range.days)}
          aria-pressed={days === range.days}
          className={cn(
            "rounded-full font-mono font-semibold uppercase tracking-wider transition-colors",
            compact ? "px-2 py-0.5 text-[0.625rem]" : "px-3 py-1 text-[0.7rem]",
            days === range.days
              ? "bg-ink text-ink-invert"
              : "text-ink-muted hover:text-ink",
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
