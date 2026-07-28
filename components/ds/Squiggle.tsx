"use client";

import type { CSSProperties } from "react";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

/**
 * One wave, built once at module scope.
 *
 * The first `q` sets a control point above the line; every following `t`
 * reflects the previous one, which alternates the humps without spelling out
 * coordinates. 600 units wide with a 30-unit period keeps the wobble fine
 * enough to survive being squeezed into a phone and gentle enough to read as a
 * drawn line, not a zigzag, when stretched across a desktop.
 */
const WAVE = (() => {
  const PERIOD = 30;
  const WIDTH = 600;
  let d = `M 0 5 q ${PERIOD / 4} -3.5 ${PERIOD / 2} 0`;
  for (let x = PERIOD / 2; x < WIDTH; x += PERIOD / 2) {
    d += ` t ${PERIOD / 2} 0`;
  }
  return d;
})();

/**
 * A hand-drawn rule that draws itself when it scrolls into view.
 *
 * Used instead of a straight `<hr>` where the divider is doing something more
 * than separating: a wave has a direction, so it reads as the page continuing
 * rather than stopping.
 */
export function Squiggle({
  className,
  delay = 0,
  ariaHidden = true,
}: {
  className?: string;
  /** Stagger in ms, matched to the surrounding reveals. */
  delay?: number;
  ariaHidden?: boolean;
}) {
  const { ref, inView } = useInView<SVGSVGElement>();

  return (
    <svg
      ref={ref}
      data-shown={inView ? "true" : "false"}
      aria-hidden={ariaHidden || undefined}
      viewBox="0 0 600 10"
      preserveAspectRatio="none"
      className={cn("squiggle block h-2.5 w-full text-line-strong", className)}
      style={{ "--squiggle-delay": `${delay}ms` } as CSSProperties}
    >
      {/* No `vector-effect: non-scaling-stroke` here, tempting as it is. It moves
          stroke geometry into screen space while `pathLength` normalises in user
          space, and the two disagree: the dash came out roughly half the length
          of the stretched path, so the wave stopped drawing halfway across and
          stayed that way. Without it the stroke is scaled with the box, which on
          a wave this shallow means a hair of extra weight on the steep parts and
          reads like pen pressure rather than a bug. */}
      <path
        d={WAVE}
        pathLength="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
