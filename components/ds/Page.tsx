import { SearchX } from "lucide-react";
import { Children, type ElementType, type ReactNode } from "react";

import { LiftText } from "./LiftText";
import { cn } from "@/lib/utils";

/**
 * The single page container. One width, one gutter, everywhere — so the navbar,
 * the content and the footer share the same optical edge at every viewport.
 */
export function Page({
  children,
  className,
  narrow = false,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
  as?: ElementType;
}) {
  return (
    <Tag className={cn(narrow ? "page-narrow" : "page", className)}>
      {children}
    </Tag>
  );
}

/**
 * Vertical rhythm for a page section. `tone="tight"` for stacked siblings,
 * `"loose"` when a section needs to breathe on its own.
 */
export function Section({
  children,
  className,
  id,
  labelledBy,
  space = "default",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
  space?: "tight" | "default" | "loose";
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "scroll-mt-24",
        space === "tight" && "py-7 sm:py-9",
        space === "default" && "py-10 sm:py-12",
        space === "loose" && "py-14 sm:py-18",
        className,
      )}
    >
      {children}
    </section>
  );
}

/**
 * Card grid that adapts to how many cards it actually has.
 *
 * A fixed three-column grid looked broken whenever the collection held one or
 * two items: a lone card stranded at a third of the width with two empty
 * columns beside it. The track count is capped by the child count so the row
 * always fills.
 */
export function CardGrid({
  children,
  className,
  columns = 3,
}: {
  children: ReactNode;
  className?: string;
  columns?: 2 | 3;
}) {
  const count = Children.count(children);
  const tracks = Math.min(columns, Math.max(count, 1));

  return (
    <div
      className={cn(
        "grid gap-6",
        tracks >= 2 && "sm:grid-cols-2",
        tracks >= 3 && "lg:grid-cols-3",
        // One card should not stretch to the full measure of the page.
        tracks === 1 && "sm:max-w-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Empty state for a grid that filtered down to nothing. */
export function EmptyState({
  title,
  hint,
  icon,
  className,
}: {
  title: string;
  hint?: string;
  /** Defaults to a struck-through magnifier: nothing matched the query. */
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-4 border border-dashed border-line-strong px-6 py-16 text-center",
        className,
      )}
    >
      <span className="mx-auto mb-5 grid size-11 place-items-center rounded-full bg-brand-wash text-brand [&_svg]:size-5">
        {icon ?? <SearchX />}
      </span>
      <p className="t-h3 text-ink">{title}</p>
      {hint ? <p className="t-body mx-auto mt-2 max-w-sm">{hint}</p> : null}
    </div>
  );
}

/**
 * Section masthead: eyebrow, title, optional deck and trailing action. Every
 * section on the site uses this, which is why they finally look related.
 */
export function SectionHeader({
  eyebrow,
  icon,
  title,
  titleId,
  deck,
  action,
  className,
}: {
  eyebrow?: ReactNode;
  /** Lucide icon element. Sits in the eyebrow so every section is scannable. */
  icon?: ReactNode;
  title: ReactNode;
  titleId?: string;
  deck?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-8 sm:mb-10", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="t-eyebrow mb-3">
              {icon ? (
                <span className="grid size-5 place-items-center rounded-full bg-brand-wash text-brand [&_svg]:size-3">
                  {icon}
                </span>
              ) : null}
              {eyebrow}
            </p>
          ) : null}
          {typeof title === "string" ? (
            <LiftText as="h2" id={titleId} className="t-h2">
              {title}
            </LiftText>
          ) : (
            <h2 id={titleId} className="t-h2">
              {title}
            </h2>
          )}
          {deck ? <p className="t-body mt-3 max-w-xl">{deck}</p> : null}
        </div>
        {action ? <div className="shrink-0 pb-1">{action}</div> : null}
      </div>
    </header>
  );
}
