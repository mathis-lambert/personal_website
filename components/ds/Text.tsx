import type { ElementType, ReactNode } from "react";

import { LiftText } from "./LiftText";
import { cn } from "@/lib/utils";

/**
 * The one small-caps label. Nothing else on the site is allowed to be
 * uppercase-bold-tracked, which is what keeps it meaningful.
 */
export function Eyebrow({
  children,
  className,
  brand = false,
  as: Tag = "p",
}: {
  children: ReactNode;
  className?: string;
  brand?: boolean;
  as?: ElementType;
}) {
  return (
    <Tag className={cn("t-eyebrow", brand && "t-eyebrow-brand", className)}>
      {children}
    </Tag>
  );
}

/**
 * Page-opening display type. One per page, at the top.
 *
 * A plain string gets the pointer-reactive letters; anything richer is rendered
 * as given, because splitting arbitrary nodes into characters would flatten
 * whatever markup the caller put inside.
 */
export function Display({
  children,
  className,
  id,
  as: Tag = "h1",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: ElementType;
}) {
  if (typeof children === "string") {
    return (
      <LiftText id={id} as={Tag as "h1"} className={cn("t-display", className)}>
        {children}
      </LiftText>
    );
  }

  return (
    <Tag id={id} className={cn("t-display", className)}>
      {children}
    </Tag>
  );
}

/** Page title on inner pages, and any heading that isn't the hero. */
export function Title({
  children,
  className,
  id,
  level = 1,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  level?: 1 | 2 | 3;
}) {
  const Tag = `h${level}` as const satisfies ElementType;

  if (typeof children === "string") {
    return (
      <LiftText id={id} as={Tag} className={cn(`t-h${level}`, className)}>
        {children}
      </LiftText>
    );
  }

  return (
    <Tag id={id} className={cn(`t-h${level}`, className)}>
      {children}
    </Tag>
  );
}

/** Standfirst paragraph under a title. Capped to the reading measure. */
export function Lead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("t-lead", className)}>{children}</p>;
}

/** Dates, read times, counts. Tabular figures so columns line up. */
export function Meta({
  children,
  className,
  as: Tag = "span",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return <Tag className={cn("t-meta", className)}>{children}</Tag>;
}

/** A drawn rule. Replaces every decorative border on the site. */
export function Rule({
  className,
  hairline = false,
}: {
  className?: string;
  hairline?: boolean;
}) {
  return (
    <hr
      role="presentation"
      className={cn(hairline ? "hairline" : "rule", className)}
    />
  );
}
