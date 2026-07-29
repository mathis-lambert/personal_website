import { ArrowRight, Briefcase, GraduationCap, Route } from "lucide-react";
import type { ReactNode } from "react";

import {
  ActionLink,
  Page,
  Reveal,
  Section,
  SectionHeader,
} from "@/components/ds";
import type { TimelineEntry } from "@/types";

/**
 * A record, not a timeline.
 *
 * Full width with the date in a right-aligned gutter, so the dates form a hard
 * column edge to scan down. Rows are separated by `divide-y` rather than a
 * border on each: a line above every row doubled the group label and made a
 * ladder with no hierarchy. The group label gets the one heavy rule.
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
  if (entries.length === 0) return null;

  return (
    <section data-ink={ink}>
      {/* One heavy rule under the group label. It is the only strong horizontal
          line in the block, which is what makes the two groups read as two
          groups instead of one long undifferentiated list. */}
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

      <ol className="divide-y divide-line">
        {entries.map((entry, index) => (
          <Reveal
            as="li"
            key={`${entry.title}-${entry.company}-${index}`}
            delay={Math.min(index, 4) * 50}
            className="grid gap-x-7 gap-y-2 py-6 md:grid-cols-[8rem_1fr]"
          >
            {/* Right-aligned from md up so the dates share a hard edge with the
                content column; inline above the title on a phone, where a
                dedicated column would waste half the width. */}
            <div className="md:pt-1 md:text-right">
              <span className="t-meta text-[0.75rem] font-bold text-brand">
                {entry.date}
              </span>
            </div>

            <div className="min-w-0">
              <h4 className="t-h3">{entry.title}</h4>
              <p className="mt-1 text-[0.9375rem] font-bold text-brand">
                {entry.company}
              </p>
              {entry.description ? (
                <p className="measure mt-2.5 text-[0.9375rem] leading-relaxed text-ink-muted">
                  {entry.description}
                </p>
              ) : null}
            </div>
          </Reveal>
        ))}
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
          deck="Dates, employers, and what I was actually responsible for."
          action={
            <ActionLink href="/resume">
              Full resume
              <ArrowRight className="size-4 transition-transform duration-200 ease-(--ease-paper) group-hover/link:translate-x-1" />
            </ActionLink>
          }
        />

        {/* Two inks, one per group. The company name and the date both sit in the
            group's ink, so a row belongs to its group by colour as well as by
            position, and the boundary between work and study is unmissable
            without a second heading treatment. */}
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
