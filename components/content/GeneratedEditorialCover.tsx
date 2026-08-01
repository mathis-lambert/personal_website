import { cn } from "@/lib/utils";

const serialFor = (title: string) =>
  [...title].reduce((total, character) => total + character.charCodeAt(0), 0) %
  100;

export function GeneratedEditorialCover({
  kind,
  title,
  eyebrow,
  date,
  details = [],
  compact = false,
}: {
  kind: "project" | "note";
  title: string;
  eyebrow?: string;
  date?: string;
  details?: string[];
  compact?: boolean;
}) {
  const accent = kind === "note" ? "#3674e8" : "#f05f55";
  const serial = String(serialFor(title)).padStart(2, "0");
  const facts = details.filter(Boolean).slice(0, compact ? 2 : 3);
  const category =
    eyebrow && eyebrow.toLocaleLowerCase() !== kind
      ? eyebrow
      : "Mathis Lambert";

  return (
    <div
      role="img"
      aria-label={`Generated cover for ${title}`}
      className={cn(
        "relative isolate size-full overflow-hidden bg-[#f1eee6] text-[#17191f]",
        compact ? "p-4" : "p-7 sm:p-9",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-[27%]"
        style={{ backgroundColor: accent }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-[27%] w-px bg-[#17191f]/15"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-[23%] h-px bg-[#17191f]/10" />

      <div className="relative flex h-full w-[73%] flex-col pr-4 sm:pr-6">
        <div className="flex items-center gap-3 font-mono text-[0.5625rem] font-bold uppercase tracking-[0.18em] text-[#17191f]/55 sm:text-[0.6875rem]">
          <span>{kind === "note" ? "Note" : "Project"}</span>
          <span aria-hidden="true" className="h-px min-w-3 flex-1 bg-[#17191f]/25" />
          <span className="truncate">{category}</span>
        </div>

        <p
          className={cn(
            "relative my-auto text-balance font-display font-semibold leading-[0.92] tracking-[-0.05em]",
            compact
              ? "line-clamp-3 text-[clamp(1.15rem,2.5vw,1.85rem)]"
              : "line-clamp-3 text-[clamp(1.8rem,5vw,4.25rem)]",
          )}
        >
          {title || "Untitled"}
        </p>

        <div
          className={cn(
            "flex min-h-5 flex-wrap items-end gap-x-3 gap-y-1 border-t border-[#17191f]/15 font-mono uppercase tracking-[0.1em] text-[#17191f]/55",
            compact ? "pt-2 text-[0.5rem]" : "pt-3 text-[0.5625rem] sm:text-[0.6875rem]",
          )}
        >
          {facts.length ? (
            facts.map((detail) => <span key={detail}>{detail}</span>)
          ) : (
            <span>{date || "Editorial archive"}</span>
          )}
        </div>
      </div>

      <div
        aria-hidden="true"
        className={cn(
          "absolute right-[3.5%] top-[8%] font-mono font-bold tracking-[-0.08em] text-white/95",
          compact ? "text-2xl" : "text-4xl sm:text-6xl",
        )}
      >
        {serial}
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-[8%] right-[4.5%] origin-bottom-right -rotate-90 whitespace-nowrap font-mono text-[0.5rem] font-bold uppercase tracking-[0.2em] text-white/80 sm:text-[0.625rem]"
      >
        Mathis Lambert
      </div>
    </div>
  );
}
