import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * The name, letter by letter, so it can wave on hover.
 *
 * Each letter carries its index as `--i` and the CSS staggers the hop from it,
 * so the bounce travels across the name rather than the word jumping at once.
 * The spans are hidden from assistive tech: the parent link already has an
 * `aria-label`, and a screen reader would spell out fourteen one-character
 * elements.
 *
 * Needs an ancestor with Tailwind's `group` class, so the wave fires from
 * anywhere on the link and not only from directly over a letter.
 */
export function Wordmark({
  name,
  className,
  accent,
}: {
  name: string;
  className?: string;
  /** Trailing character in the accent colour. The period is the mark. */
  accent?: string;
}) {
  return (
    <span aria-hidden="true" className={cn("inline-flex", className)}>
      {[...name].map((character, index) => (
        <span
          key={`${character}-${index}`}
          className="wordmark-letter"
          style={{ "--i": index } as CSSProperties}
        >
          {/* A plain space as a flex item has no width. The gap between first
              and last name has to be a hard space to survive. */}
          {character === " " ? " " : character}
        </span>
      ))}
      {accent ? (
        <span
          className="wordmark-letter text-coral"
          style={{ "--i": name.length } as CSSProperties}
        >
          {accent}
        </span>
      ) : null}
    </span>
  );
}
