import { CalendarRange, MapPin } from "lucide-react";
import Image from "next/image";

import { Tag } from "@/components/ds";
import { resumeLabels, type ResumeLocale } from "@/lib/resume/localization";
import { cn } from "@/lib/utils";
import type { Experience } from "@/types";

/**
 * One role.
 *
 * Badges carry the hierarchy — period, location, whether it's current — and a
 * hairline separates rows. Wrapping each entry in its own raised card, as an
 * earlier pass did, put a white slab on a near-white page: heavy, and no more
 * legible for it. The one role marked `highlight` gets a wash of the section
 * ink instead, which distinguishes it without adding chrome.
 */
export function ExperienceEntry({
  experience,
  locale = "en",
}: {
  experience: Experience;
  locale?: ResumeLocale;
}) {
  const highlight = Boolean(experience.highlight);

  return (
    <article
      className={cn(
        "border-t border-line py-5",
        // The current role is flagged with a rule in the section ink, not a
        // filled panel: a pale slab behind one entry read as a hover state.
        highlight && "-ml-4 border-l-2 border-l-brand pl-[calc(1rem-2px)]",
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag tone="brand">
          <CalendarRange className="size-3" />
          {experience.period}
        </Tag>
        {experience.current ? (
          <Tag className="border-coral/35 bg-coral/12 text-coral">
            {resumeLabels[locale].current}
          </Tag>
        ) : null}
        {experience.location ? (
          <Tag>
            <MapPin className="size-3" />
            {experience.location}
          </Tag>
        ) : null}
      </div>

      <div className="mt-3.5 flex items-start gap-3">
        {/* A framed tile, not a loose 20px favicon. Entries without a logo get
            the company's initial in the same box, so every row in the column
            starts on the same left edge whether or not a mark exists. */}
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-2 border border-line bg-paper-lift"
        >
          {experience.logo ? (
            <Image
              src={experience.logo}
              alt=""
              width={36}
              height={36}
              loading="lazy"
              className="size-full object-contain p-1.5"
            />
          ) : (
            <span className="font-display text-[0.9rem] font-semibold text-ink-faint">
              {experience.company.trim().charAt(0).toUpperCase()}
            </span>
          )}
        </span>

        <div className="min-w-0 pt-0.5">
          <h4 className="t-h3">{experience.role}</h4>
          <p className="mt-0.5 text-[0.9375rem] font-bold text-brand">
            {experience.company}
            {experience.position ? (
              <span className="font-normal text-ink-faint">
                {" · "}
                {experience.position}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {experience.description.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5 pl-12">
          {experience.description.map((item, index) => (
            <li key={index} className="flex gap-2.5">
              <span
                aria-hidden="true"
                className="mt-[0.55em] size-1 shrink-0 rounded-full bg-brand"
              />
              <span className="text-[0.875rem] leading-6 text-ink-muted">
                {item}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
