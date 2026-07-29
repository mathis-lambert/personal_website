import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { externalLinkProps } from "@/lib/ui/links";
import { cn } from "@/lib/utils";

type ActionTone = "ink" | "brand" | "quiet" | "ghost";
type ActionSize = "sm" | "md" | "lg";

/** Every tone rises on hover and settles on press — see `.action-motion`. */
const base =
  "group/action action-motion inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold leading-none no-underline " +
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
        {...externalLinkProps(href)}
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
      {...externalLinkProps(href)}
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
  const classes = cn(
    base,
    tones[tone],
    "size-10 px-0 [&_svg]:size-4",
    className,
  );

  if ("href" in rest && typeof rest.href === "string") {
    const { href, ...linkProps } = rest as AsLink;
    return (
      <Link
        href={href}
        aria-label={label}
        className={classes}
        {...externalLinkProps(href)}
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
