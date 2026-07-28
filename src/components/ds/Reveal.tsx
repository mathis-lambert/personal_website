"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

/**
 * The site's only entrance animation.
 *
 * Deliberately CSS-driven and one-shot: the previous version remounted whole
 * grids to replay Framer Motion keyframes, which re-decoded every image and
 * dropped focus on each keystroke. Here the observer disconnects after the
 * first intersection and nothing re-renders afterwards.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  ink,
  style,
}: {
  children: ReactNode;
  className?: string;
  /** Stagger in ms. Cap it yourself — long ladders read as lag, not polish. */
  delay?: number;
  as?: ElementType;
  /**
   * Section ink. Declared rather than passed through as `data-ink`, because a
   * hyphenated JSX attribute is not type-checked and would be dropped here in
   * silence.
   */
  ink?: string;
  style?: CSSProperties;
}) {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <Tag
      ref={ref}
      data-shown={inView ? "true" : "false"}
      data-ink={ink}
      className={cn("reveal", className)}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
