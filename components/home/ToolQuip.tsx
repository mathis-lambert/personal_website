"use client";

import { useCallback, useRef, useState } from "react";

import { TokenStream } from "@/components/ds";

/**
 * A coding tool that answers back.
 *
 * The joke is the mechanism, not just the words: hovering makes the tool
 * generate its own line, streamed token by token in the same animation the
 * hero headline uses. An AI tool caught improvising an excuse for itself.
 *
 * Each hover advances to the next line, so it rewards a second and third pass
 * rather than repeating.
 */
export function ToolQuip({
  name,
  quips,
  children,
}: {
  name: string;
  quips: string[];
  children: React.ReactNode;
}) {
  const [quip, setQuip] = useState<{ text: string; run: number } | null>(null);
  const next = useRef(0);

  const show = useCallback(() => {
    if (quips.length === 0) return;
    setQuip({ text: quips[next.current % quips.length]!, run: next.current });
    next.current += 1;
  }, [quips]);

  return (
    <li
      className="group/tool flex items-center gap-3"
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") show();
      }}
      onPointerLeave={() => setQuip(null)}
      onFocus={show}
      onBlur={() => setQuip(null)}
    >
      {children}

      <span className="min-w-0 flex-1">
        <span className="text-sm font-bold text-ink">{name}</span>

        {/* Keyed on the run so a fresh hover restarts the stream rather than
            re-using the finished animation. */}
        {quip ? (
          <TokenStream
            key={quip.run}
            as="span"
            step={26}
            startDelay={0}
            className="t-meta ml-2 text-brand"
            segments={[quip.text]}
          />
        ) : null}
      </span>
    </li>
  );
}
