import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ActionTone = "ink" | "brand" | "quiet" | "ghost";
type ActionSize = "sm" | "md" | "lg";

/**
 * Every tone rises on hover and settles on press.
 *
 * The transition names `translate`, not `transform`: Tailwind v4 emits the
 * `translate` property for `-translate-y-*`, so a transition list built around
 * `transform` leaves the movement uneased and the button teleports.
 *
 * The overshoot curve is the point. A button that travels linearly reads as a
 * state change; one that overshoots slightly reads as an object being lifted.
 */
const base =
  "group/action inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold leading-none no-underline " +
  "transition-[translate,background-color,border-color,color,box-shadow] duration-200 ease-(--ease-out-back) " +
  "hover:-translate-y-0.5 active:translate-y-0 active:duration-75 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper " +
  "disabled:pointer-events-none disabled:opacity-45 disabled:hover:translate-y-0 [&_svg]:shrink-0";

const tones: Record<ActionTone, string> = {
  // The primary commitment on a page: solid ink, inverted label.
  ink: "bg-ink text-ink-invert hover:shadow-[var(--shadow-2)]",
  // Reserved for the single most important action in a view.
  brand: "bg-brand text-brand-ink hover:shadow-[var(--shadow-2)]",
  // The default for everything else.
  quiet:
    "border border-line bg-paper-lift text-ink hover:border-line-strong hover:bg-paper-sink hover:shadow-[var(--shadow-1)]",
  // Inline, no chrome.
  ghost: "text-ink-muted hover:bg-paper-sink hover:text-ink",
};

const sizes: Record<ActionSize, string> = {
  sm: "h-9 px-3.5 text-[0.8125rem] [&_svg]:size-3.5",
  md: "h-11 px-5 text-sm [&_svg]:size-4",
  lg: "h-13 px-6 text-[0.9375rem] [&_svg]:size-4",
};

const isExternalHref = (href: string) => /^(https?:)?\/\/|^mailto:|^tel:/.test(href);

type Shared = {
  children: ReactNode;
  className?: string;
  tone?: ActionTone;
  size?: ActionSize;
};

type AsLink = Shared & { href: string } & Omit<
    ComponentProps<typeof Link>,
    "href" | "className" | "children"
  >;

type AsButton = Shared & { href?: never } & Omit<
    ComponentProps<"button">,
    "className" | "children"
  >;

/**
 * The one call-to-action. Renders an anchor when given `href`, a button
 * otherwise — so links keep middle-click and open-in-new-tab, which the old
 * `router.push()` cards had quietly broken.
 */
export function Action({
  children,
  className,
  tone = "quiet",
  size = "md",
  ...rest
}: AsLink | AsButton) {
  const classes = cn(base, tones[tone], sizes[size], className);

  if ("href" in rest && typeof rest.href === "string") {
    const { href, ...linkProps } = rest as AsLink;
    return (
      <Link
        href={href}
        className={classes}
        {...(isExternalHref(href)
          ? { target: "_blank", rel: "noopener noreferrer" }
          : null)}
        {...linkProps}
      >
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = rest as AsButton;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}

/**
 * A text link with the shared sliding underline. Used for "see all" style
 * navigation where a full button would be too heavy.
 */
export function ActionLink({
  children,
  href,
  className,
  ...rest
}: { children: ReactNode; href: string; className?: string } & Omit<
  ComponentProps<typeof Link>,
  "href" | "className" | "children"
>) {
  return (
    <Link
      href={href}
      className={cn(
        "link-slide group/link inline-flex items-center gap-2 text-sm font-bold",
        className,
      )}
      {...(isExternalHref(href)
        ? { target: "_blank", rel: "noopener noreferrer" }
        : null)}
      {...rest}
    >
      {children}
    </Link>
  );
}

/** Square icon-only control: theme toggle, menu, close. */
export function IconAction({
  children,
  className,
  tone = "quiet",
  label,
  ...rest
}: (AsLink | AsButton) & { label: string }) {
  const classes = cn(base, tones[tone], "size-10 px-0 [&_svg]:size-4", className);

  if ("href" in rest && typeof rest.href === "string") {
    const { href, ...linkProps } = rest as AsLink;
    return (
      <Link
        href={href}
        aria-label={label}
        className={classes}
        {...(isExternalHref(href)
          ? { target: "_blank", rel: "noopener noreferrer" }
          : null)}
        {...linkProps}
      >
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = rest as AsButton;
  return (
    <button type={type} aria-label={label} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
