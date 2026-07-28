import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The one chip. Deliberately monochrome: tags used to carry a different hue
 * per category, which made every card look like a different website.
 */
export function Tag({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "brand" | "solid";
}) {
  return (
    <span
      className={cn(
        "tag",
        tone === "brand" && "tag-brand",
        tone === "solid" && "tag-solid",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * A wrapped row of tags with an optional cap. Shows `+n` rather than silently
 * dropping the overflow.
 */
export function TagList({
  items,
  max,
  className,
  tone = "default",
}: {
  items: string[];
  max?: number;
  className?: string;
  tone?: "default" | "brand" | "solid";
}) {
  if (items.length === 0) return null;

  const shown = typeof max === "number" ? items.slice(0, max) : items;
  const hidden = items.length - shown.length;

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {shown.map((item) => (
        <li key={item}>
          <Tag tone={tone}>{item}</Tag>
        </li>
      ))}
      {hidden > 0 ? (
        <li>
          <Tag className="text-ink-faint">+{hidden}</Tag>
        </li>
      ) : null}
    </ul>
  );
}
