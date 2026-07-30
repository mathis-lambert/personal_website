"use client";

import {
  ArrowRight,
  Briefcase,
  ChevronDown,
  GraduationCap,
  Route,
} from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import {
  ActionLink,
  Page,
  Reveal,
  Section,
  SectionHeader,
  TokenStream,
} from "@/components/ds";
import { toTimeline } from "@/lib/content/timeline";
import { cn } from "@/lib/utils";
import type { TimelineEntry } from "@/types";

/**
 * A record you read as a chart.
 *
 * Every description used to be open at once, which made the block a wall nobody
 * reads. Folding them away leaves a row per job — and the space that frees up
 * goes to a bar per row on one axis shared by the group, so the shape of the
 * run (the two-month experiments, the four-year gap, the stretch that has not
 * ended) is legible before a single word is.
 */
function Group({
  heading,
  icon,
  ink,
  entries,
}: {
  heading: string;
  icon: ReactNode;
  ink: string;
  entries: TimelineEntry[];
}) {
  const id = useId();
  const [open, setOpen] = useState<number | null>(null);
  /**
   * How many times each row has been opened. It does two jobs: a row with no
   * count has never been opened, so its description is not in the DOM at all
   * (a paragraph costs a span per character here); and bumping the count
   * remounts the stream, so reopening replays it rather than showing a
   * finished animation.
   */
  const [runs, setRuns] = useState<Record<number, number>>({});

  const toggle = (index: number) => {
    if (open === index) {
      setOpen(null);
      return;
    }
    setOpen(index);
    setRuns((previous) => ({
      ...previous,
      [index]: (previous[index] ?? 0) + 1,
    }));
  };

  if (entries.length === 0) return null;

  const timeline = toTimeline(entries.map((entry) => entry.date));

  /* Rows and scale share one column definition. Two copies drifting apart would
     put the scale's ends somewhere the bars never reach, which is worse than no
     scale at all. */
  const columns = "grid gap-x-7 md:grid-cols-[11rem_1fr]";

  return (
    <section data-ink={ink}>
      <h3 className="flex items-center gap-2.5 border-b-2 border-ink pb-3">
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-2 bg-brand text-brand-ink [&_svg]:size-3.5"
        >
          {icon}
        </span>
        <span className="font-display text-[1.2rem] font-semibold tracking-[-0.02em] text-ink">
          {heading}
        </span>
        <span className="t-meta ml-auto text-coral">
          {String(entries.length).padStart(2, "0")}
        </span>
      </h3>

      {/* What the bars below are measured against. Without it they are only
          relative to each other, and calibrating means reading every date —
          the work the chart exists to save. */}
      {timeline ? (
        <div className={cn(columns, "pt-3")} aria-hidden="true">
          <div className="t-meta flex items-baseline justify-between text-[0.625rem] text-ink-faint">
            <span>{timeline.from}</span>
            <span>{timeline.to}</span>
          </div>
        </div>
      ) : null}

      <ol className="divide-y divide-line">
        {entries.map((entry, index) => {
          const isOpen = open === index;
          const bar = timeline?.bars[index];
          const panelId = `${id}-${index}`;

          const head = (
            <>
              {/* Right-aligned from md up so the dates share a hard edge with
                  the content column; the bar sits under them, spanning the
                  gutter, which is what turns the column into an axis. */}
              <div className="md:pt-1">
                <span className="t-meta block text-[0.75rem] font-bold text-brand md:text-right">
                  {entry.date}
                </span>
                {bar ? (
                  <span aria-hidden="true" className="span-track mt-2.5">
                    <span
                      className="span-fill"
                      style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                    />
                  </span>
                ) : null}
              </div>

              <div className="flex min-w-0 items-start gap-4">
                <span className="min-w-0 flex-1">
                  <span className="t-h3 block">{entry.title}</span>
                  <span className="mt-1 block text-[0.9375rem] font-bold text-brand">
                    {entry.company}
                  </span>
                </span>
                {entry.description ? (
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "mt-1.5 size-4 shrink-0 text-ink-faint transition-[rotate,color] duration-200 ease-(--ease-paper)",
                      "group-hover/row:text-brand",
                      isOpen && "rotate-180 text-brand",
                    )}
                  />
                ) : null}
              </div>
            </>
          );

          const layout = cn(columns, "gap-y-2 py-6");

          return (
            <Reveal as="li" key={panelId} delay={Math.min(index, 4) * 50}>
              {entry.description ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className={cn(
                      layout,
                      "group/row relative w-full cursor-pointer text-left",
                      // A rule in the section ink, not a filled row: across
                      // this much width a wash is a slab. Same marker the
                      // resume uses for the role you currently hold.
                      "before:absolute before:inset-y-5 before:-left-4 before:w-[3px] before:rounded-full before:bg-brand",
                      "before:scale-y-0 before:opacity-0 before:transition-[scale,opacity] before:duration-200 before:ease-(--ease-paper)",
                      "hover:before:scale-y-100 hover:before:opacity-100",
                      "focus-visible:outline-none focus-visible:before:scale-y-100 focus-visible:before:opacity-100",
                    )}
                  >
                    {head}
                  </button>

                  <div id={panelId} className="fold" data-open={isOpen}>
                    <div>
                      {runs[index] ? (
                        <div className="pb-6 md:pl-[calc(11rem+1.75rem)]">
                          {/* Written out the way the thing being described
                              writes. Fast enough to read past — a paragraph at
                              the headline's pace would be a wait, not a flourish. */}
                          <TokenStream
                            key={`${panelId}-${runs[index]}`}
                            as="p"
                            lift={false}
                            step={15}
                            startDelay={90}
                            className="max-w-[40rem] text-[1.0625rem] leading-relaxed text-ink-muted"
                            segments={[entry.description]}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : (
                <div className={layout}>{head}</div>
              )}
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}

export function Path({
  experiences,
  studies,
}: {
  experiences: TimelineEntry[];
  studies: TimelineEntry[];
}) {
  const visibleExperiences = experiences.filter((entry) => !entry.hide);
  const visibleStudies = studies.filter((entry) => !entry.hide);

  return (
    <Page as="div" data-ink="azure">
      <Section id="path" labelledBy="path-title">
        <SectionHeader
          eyebrow="The path so far"
          icon={<Route />}
          title="Where I've worked, what I studied."
          titleId="path-title"
          deck="Open a row to read what the job actually was."
          action={
            <ActionLink href="/resume">
              Full resume
              <ArrowRight className="size-4 transition-transform duration-200 ease-(--ease-paper) group-hover/link:translate-x-1" />
            </ActionLink>
          }
        />

        {/* Two inks, one per group. Each group gets its own axis: they are two
            separate records, and one shared scale would squash the studies
            against eight years of work. */}
        <div className="flex flex-col gap-14">
          <Group
            heading="Experience"
            icon={<Briefcase />}
            ink="azure"
            entries={visibleExperiences}
          />
          <Group
            heading="Studies"
            icon={<GraduationCap />}
            ink="turquoise"
            entries={visibleStudies}
          />
        </div>
      </Section>
    </Page>
  );
}
