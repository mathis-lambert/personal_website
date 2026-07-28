"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";

/**
 * Letters that rise toward the cursor.
 *
 * Not the navbar's wave, which is a fixed animation triggered by hover. Here the
 * pointer is the input: each letter's lift is a function of how far it is from
 * the cursor, so moving across a headline pushes a travelling bump through it
 * and stopping holds the letters under your hand up. Leaving settles them back.
 *
 * Nothing re-renders. The pointer handler writes two custom properties straight
 * onto each letter's style, rects are measured once per pointer entry rather
 * than per move, and the whole thing is throttled to a frame. A headline of
 * forty letters would otherwise be forty React updates per mouse event.
 */

/** How far from a letter the cursor still has an effect. */
const REACH = 110;
/** Peak rise, in em, so it scales with the type it is applied to. */
const RISE = 0.34;

type Metrics = { center: number; top: number };

export function useLetterLift<T extends HTMLElement>(reach: number = REACH) {
  const ref = useRef<T | null>(null);
  const letters = useRef<HTMLElement[]>([]);
  const metrics = useRef<Metrics[]>([]);
  const frame = useRef<number | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    letters.current = Array.from(
      node.querySelectorAll<HTMLElement>("[data-letter]"),
    );
    metrics.current = letters.current.map((letter) => {
      const rect = letter.getBoundingClientRect();
      return { center: rect.left + rect.width / 2, top: rect.top + rect.height / 2 };
    });
  }, []);

  const apply = useCallback(() => {
    frame.current = null;
    const point = pointer.current;

    letters.current.forEach((letter, index) => {
      if (!point) {
        letter.style.setProperty("--lift", "0");
        return;
      }
      const spot = metrics.current[index];
      if (!spot) return;

      // Distance in two dimensions, so the bump fades as the cursor drops away
      // from the line rather than reaching down the whole page.
      const dx = point.x - spot.center;
      const dy = (point.y - spot.top) * 1.6;
      const distance = Math.hypot(dx, dy);
      if (distance > reach) {
        letter.style.setProperty("--lift", "0");
        return;
      }

      // Raised cosine: peaks under the cursor and eases to nothing at the edge
      // of the reach, so there is no seam where letters snap back.
      const falloff = (Math.cos((distance / reach) * Math.PI) + 1) / 2;
      letter.style.setProperty("--lift", falloff.toFixed(3));
    });
  }, [reach]);

  const schedule = useCallback(() => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(apply);
  }, [apply]);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<T>) => {
      if (event.pointerType === "touch") return;
      pointer.current = { x: event.clientX, y: event.clientY };
      schedule();
    },
    [schedule],
  );

  const onPointerEnter = useCallback(
    (event: React.PointerEvent<T>) => {
      if (event.pointerType === "touch") return;
      measure();
      pointer.current = { x: event.clientX, y: event.clientY };
      schedule();
    },
    [measure, schedule],
  );

  const onPointerLeave = useCallback(() => {
    pointer.current = null;
    schedule();
  }, [schedule]);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  return {
    ref,
    handlers: { onPointerMove, onPointerEnter, onPointerLeave },
  } as const;
}

/**
 * Split a string into per-letter spans that `useLetterLift` can drive.
 *
 * Words stay in a non-breaking box so a line can never break mid-word, and
 * spaces are emitted as hard spaces because a lone space in an inline-block
 * collapses to nothing.
 */
export function liftLetters(
  text: string,
  keyPrefix: string,
  rise: number = RISE,
): ReactNode[] {
  return text.split(/(\s+)/).flatMap<ReactNode>((part, partIndex) => {
    if (!part) return [];
    if (/^\s+$/.test(part)) return [" "];

    return [
      <span
        key={`${keyPrefix}-${partIndex}`}
        className="inline-block whitespace-nowrap"
      >
        {[...part].map((character, index) => (
          <span
            key={index}
            data-letter=""
            className="lift-letter"
            style={{ "--rise": `${rise}em` } as CSSProperties}
          >
            {character}
          </span>
        ))}
      </span>,
    ];
  });
}

/** A heading whose letters answer the pointer. */
export function LiftText({
  children,
  className,
  as: Tag = "span",
  id,
  rise = RISE,
  reach = REACH,
}: {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  id?: string;
  /** Peak rise in em. Small type wants less than a display headline. */
  rise?: number;
  /** Cursor reach in px. Scale it with the size of the text. */
  reach?: number;
}) {
  const { ref, handlers } = useLetterLift<HTMLElement>(reach);

  return (
    <Tag id={id} ref={ref as never} className={className} {...handlers}>
      {liftLetters(children, "l", rise)}
    </Tag>
  );
}
