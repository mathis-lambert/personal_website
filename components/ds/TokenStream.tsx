"use client";

import type { CSSProperties, ReactNode } from "react";

import { useLetterLift } from "./LiftText";

export type StreamSegment = string | { mark: string } | { break: true };

/** Roughly how a tokeniser would carve a word up: short words whole, long ones split. */
function chunkWord(word: string): string[] {
  if (word.length <= 6) return [word];
  const cut = Math.ceil(word.length / 2);
  return [word.slice(0, cut), word.slice(cut)];
}

/**
 * The headline arrives the way the subject's own systems produce text: in
 * chunks, left to right.
 *
 * Each word sits in a non-breaking wrapper around its chunks. The chunks are
 * `inline-block`, so without it a line can break inside a word ("soft / ware").
 * The wrapper also carries the underline, drawn once per word rather than once
 * per chunk.
 *
 * Pure CSS: no timers, no re-renders. Under `prefers-reduced-motion` the text is
 * simply there.
 */
export function TokenStream({
  segments,
  className,
  /** Milliseconds between chunks. */
  step = 42,
  /** Delay before the first chunk, to let the eye land. */
  startDelay = 160,
  as: Tag = "h1",
  id,
}: {
  segments: StreamSegment[];
  className?: string;
  step?: number;
  startDelay?: number;
  as?: "h1" | "h2" | "p" | "div" | "span";
  id?: string;
}) {
  // Count first, so the marked word knows when the whole headline has landed:
  // the underline draws itself after the last token, not on top of it.
  const totalChunks = segments.reduce((total, segment) => {
    if (typeof segment === "object" && "break" in segment) return total;
    const text = typeof segment === "string" ? segment : segment.mark;
    return (
      total +
      text
        .split(/(\s+)/)
        .filter((part) => part && !/^\s+$/.test(part))
        .reduce((count, word) => count + chunkWord(word).length, 0)
    );
  }, 0);
  const markDelay = startDelay + totalChunks * step + 140;

  const { ref, handlers } = useLetterLift<HTMLElement>();

  let index = 0;
  const nodes: ReactNode[] = [];

  const push = (text: string, mark: boolean) => {
    // Always collect locally, then either wrap the lot in one mark (so its
    // rule is continuous) or spill it straight out.
    const parts: ReactNode[] = [];

    for (const part of text.split(/(\s+)/)) {
      if (!part) continue;

      // Whitespace goes out as a bare text node: wrapped in an inline-block it
      // would collapse to zero width and weld the words together.
      if (/^\s+$/.test(part)) {
        parts.push(part);
        continue;
      }

      const chunks = chunkWord(part);
      const first = index;

      parts.push(
        <span
          key={`w-${first}-${part}`}
          className="inline-block whitespace-nowrap"
        >
          {/* A chunk is the unit that arrives; a letter is the unit the pointer
              lifts. Both live on the same span: `--token-delay` drives the
              entrance, `--lift` the hover, and they never fight because one is
              an animation on opacity and the other a transform. */}
          {chunks.map((chunk, offset) =>
            [...chunk].map((character, position) => (
              <span
                key={`${offset}-${position}`}
                data-letter=""
                className="lift-letter"
                style={{ "--rise": "0.3em" } as CSSProperties}
              >
                {/* Nested rather than combined: the entrance keyframes animate
                    `transform`, and an animation with `both` fill keeps winning
                    over the lift's transform once it ends. One element per
                    property, so neither can cancel the other. */}
                <span
                  className="stream-token"
                  style={
                    {
                      "--token-delay": `${startDelay + (first + offset) * step}ms`,
                    } as CSSProperties
                  }
                >
                  {character}
                </span>
              </span>
            )),
          )}
        </span>,
      );

      index += chunks.length;
    }

    if (mark) {
      nodes.push(
        <span
          key={`m-${index}`}
          className="mark-brand mark-draw"
          style={{ "--mark-delay": `${markDelay}ms` } as CSSProperties}
        >
          {parts}
        </span>,
      );
    } else {
      nodes.push(...parts);
    }
  };

  for (const segment of segments) {
    if (typeof segment === "string") {
      push(segment, false);
    } else if ("break" in segment) {
      nodes.push(<br key={`br-${index}`} />);
    } else {
      push(segment.mark, true);
    }
  }

  return (
    <Tag id={id} ref={ref as never} className={className} {...handlers}>
      {nodes}
    </Tag>
  );
}
