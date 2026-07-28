"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * The console's shared parts.
 *
 * Mono for the interface, Lato for content. Labels, counts, column headings and
 * keys are set in the data face; the words being edited are not. It is the one
 * rule that keeps a dense screen legible, because you can always tell chrome
 * from what you typed.
 */

export function PageHeader({
  title,
  description,
  count,
  actions,
}: {
  title: string;
  description?: string;
  /** Shown next to the title. Say how much of a thing there is. */
  count?: number;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-5">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2.5">
          <h1 className="font-display text-[1.65rem] font-semibold tracking-[-0.025em] text-ink">
            {title}
          </h1>
          {typeof count === "number" ? (
            <span className="t-meta text-ink-faint">
              {String(count).padStart(2, "0")}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="measure mt-1.5 text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

/** A titled region. No box: a label and a rule are enough to group things. */
export function Panel({
  title,
  hint,
  actions,
  children,
  className,
}: {
  title: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-3 flex items-center justify-between gap-4 border-b border-line pb-2">
        <div className="flex items-baseline gap-2.5">
          <h2 className="t-eyebrow text-ink">{title}</h2>
          {hint ? <span className="t-meta text-ink-faint">{hint}</span> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2.5 py-1">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-9 w-full" />
      ))}
    </div>
  );
}

/**
 * An empty state that says what to do next, not just that there is nothing.
 */
export function Empty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3 border border-dashed border-line px-6 py-12 text-center">
      <p className="font-display text-[1.0625rem] font-semibold text-ink">
        {title}
      </p>
      {hint ? (
        <p className="measure mx-auto mt-1.5 text-sm text-ink-muted">{hint}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-3 border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-ink"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <span>{message}</span>
    </div>
  );
}

export function Busy({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </span>
  );
}
