import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SurfaceTone = "lift" | "quiet" | "well" | "invert";

/**
 * The one content surface. Every card, panel and widget on the site is this
 * component — there is no second card style, and no glass anywhere.
 *
 * `interactive` opts into the shared hover lift; put `group` on the element
 * that owns the hover if the trigger is a parent (e.g. a wrapping link).
 */
export function Surface({
  children,
  className,
  tone = "lift",
  interactive = false,
  flip = false,
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  tone?: SurfaceTone;
  interactive?: boolean;
  flip?: boolean;
  as?: ElementType;
} & Record<string, unknown>) {
  return (
    <Tag
      className={cn(
        tone === "lift" && "surface",
        tone === "quiet" && "surface-quiet",
        tone === "well" && "well",
        tone === "invert" && "surface-invert",
        flip && "surface-flip",
        interactive && "lift",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
