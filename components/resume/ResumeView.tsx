"use client";

import {
  Award,
  Braces,
  Briefcase,
  CalendarRange,
  Download,
  GraduationCap,
  Heart,
  Languages,
  Loader2,
  Mail,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

import { trackUiEvent } from "@/api/analytics";
import { downloadResumePdf } from "@/api/resume";
import {
  Action,
  Eyebrow,
  LiftText,
  Page,
  Reveal,
  Tag,
  TagList,
} from "@/components/ds";
import { CertificationsCard } from "@/components/resume/CertificationsCard";
import { ExperienceEntry } from "@/components/resume/ExperienceEntry";
import {
  resolveResumeContent,
  resumeLabels,
  type ResumeLocale,
} from "@/lib/resume/localization";
import { externalLinkProps } from "@/lib/ui/links";
import { cn } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";

/** A CV section: icon tile, title, count, then content. No container. */
function Block({
  title,
  icon,
  ink,
  count,
  delay = 0,
  children,
  className,
}: {
  title: string;
  icon: ReactNode;
  ink: string;
  count?: number;
  /** Stagger, so the CV assembles top-down instead of appearing at once. */
  delay?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Reveal
      as="section"
      delay={delay}
      ink={ink}
      className={cn("break-inside-avoid", className)}
    >
      <h2 className="mb-5 flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-2 bg-brand text-brand-ink [&_svg]:size-3.5"
        >
          {icon}
        </span>
        <span className="font-display text-[1.2rem] font-semibold tracking-[-0.02em] text-ink">
          {title}
        </span>
        {typeof count === "number" && count > 0 ? (
          <span className="t-meta ml-auto text-coral">
            {String(count).padStart(2, "0")}
          </span>
        ) : null}
      </h2>
      {children}
    </Reveal>
  );
}

/** A labelled group of tags in the skills grid. */
function Group({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="t-eyebrow mb-2.5 text-ink-faint">{label}</p>
      <TagList items={items} />
    </div>
  );
}

/**
 * The resume: narrative on the left, reference data on the right, divided by a
 * single hairline. One ink throughout — six coloured icon tiles down one
 * document was the same "too many colours" problem in miniature.
 */
export default function ResumeView({
  resumeData,
  locale,
  onLocaleChange,
  localePending = false,
}: {
  resumeData: ResumeData | null;
  locale: ResumeLocale;
  onLocaleChange: (locale: ResumeLocale) => void;
  localePending?: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const data = resolveResumeContent(resumeData, locale);
  const labels = resumeLabels[locale];

  const exportPdf = async () => {
    void trackUiEvent({ name: "resume_export_click", properties: { locale } });
    try {
      setDownloading(true);
      await downloadResumePdf({ locale });
    } catch (error) {
      console.error("Failed to export resume PDF", error);
    } finally {
      setDownloading(false);
    }
  };

  const skills = data.technical_skills;
  const skillGroups = [
    { title: labels.programming, items: skills?.programming ?? [] },
    { title: labels.aiMl, items: skills?.ai_ml ?? [] },
    { title: labels.systemsAndInfra, items: skills?.systems_and_infra ?? [] },
    { title: labels.web, items: skills?.web ?? [] },
  ].filter((group) => group.items.length > 0);

  const contacts = [
    data.contact.email && {
      icon: <Mail className="size-3.5" />,
      label: data.contact.email,
      href: `mailto:${data.contact.email}`,
    },
    data.contact.linkedin && {
      icon: <FaLinkedin className="size-3.5" />,
      label: `in/${data.contact.linkedin}`,
      href: `https://linkedin.com/in/${data.contact.linkedin}`,
    },
    data.contact.github && {
      icon: <FaGithub className="size-3.5" />,
      label: data.contact.github,
      href: `https://github.com/${data.contact.github}`,
    },
  ].filter(Boolean) as { icon: ReactNode; label: string; href: string }[];

  const experiences = data.experiences?.filter((item) => !item.hide) ?? [];

  return (
    <Page as="article" data-ink="azure" className="pb-20 pt-10 sm:pt-14">
      {/* Masthead on paper. The name carries it; nothing needs a box. */}
      <Reveal as="header" className="border-b-2 border-ink pb-8">
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
          <div className="min-w-0">
            <Eyebrow brand className="mb-4">
              Curriculum vitae
            </Eyebrow>
            <LiftText as="h1" className="t-h1">
              {data.name}
            </LiftText>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div
              role="group"
              aria-label={labels.language}
              className="inline-flex rounded-full border border-line p-1"
            >
              {(["en", "fr"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onLocaleChange(code)}
                  disabled={localePending || downloading}
                  aria-pressed={locale === code}
                  className={cn(
                    "rounded-full px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-wider transition-colors duration-200 ease-(--ease-paper) disabled:opacity-50",
                    locale === code
                      ? "bg-ink text-ink-invert"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {code}
                </button>
              ))}
            </div>

            <Action
              tone="ink"
              size="sm"
              onClick={exportPdf}
              aria-busy={downloading}
              disabled={downloading || localePending}
            >
              {downloading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
              PDF
            </Action>
          </div>
        </div>

        {data.personal_statement ? (
          <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-ink-muted">
            {data.personal_statement}
          </p>
        ) : null}

        {contacts.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-x-7 gap-y-2.5">
            {contacts.map((contact) => (
              <li key={contact.href}>
                <a
                  href={contact.href}
                  {...externalLinkProps(contact.href)}
                  className="inline-flex items-center gap-2 text-[0.875rem] font-bold text-ink-muted no-underline transition-colors duration-200 hover:text-brand"
                >
                  <span className="text-brand">{contact.icon}</span>
                  {contact.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </Reveal>

      {/* Two columns: narrative on the left, reference data on the right. The
          split was right all along — what failed was wrapping the right-hand
          column in a big soft grey panel, which read as one undifferentiated
          slab with tags loose inside it. A single hairline does the same job of
          saying "different kind of information" and then disappears. */}
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
        <main className="flex flex-col gap-12">
          <Block
            title={labels.experience}
            icon={<Briefcase />}
            ink="azure"
            delay={60}
            count={experiences.length}
          >
            {experiences.map((experience, index) => (
              <ExperienceEntry
                key={`${experience.company}-${index}`}
                experience={experience}
                locale={locale}
              />
            ))}
          </Block>

          {data.education.length > 0 ? (
            <Block
              title={labels.education}
              icon={<GraduationCap />}
              ink="azure"
              delay={120}
              count={data.education.length}
            >
              {/* Same rhythm as an experience entry — badge row, then title —
                  so both sections share one left edge. */}
              {data.education.map((entry, index) => (
                <div key={index} className="border-t border-line py-5">
                  <Tag tone="brand">
                    <CalendarRange className="size-3" />
                    {entry.period}
                  </Tag>
                  <p className="mt-3.5 text-[1.0625rem] font-bold leading-snug text-ink">
                    {entry.institution}
                  </p>
                  <p className="mt-0.5 text-[0.9375rem] text-ink-muted">
                    {entry.degree}
                  </p>
                </div>
              ))}
            </Block>
          ) : null}
        </main>

        <aside className="flex flex-col gap-10 lg:border-l lg:border-line lg:pl-14">
          {skillGroups.length > 0 ? (
            <Block
              title={labels.technicalSkills}
              icon={<Braces />}
              ink="azure"
              delay={100}
            >
              <div className="flex flex-col gap-5 border-t border-line pt-5">
                {skillGroups.map((group) => (
                  <Group
                    key={group.title}
                    label={group.title}
                    items={group.items}
                  />
                ))}
              </div>
            </Block>
          ) : null}

          {(data.certifications?.length ?? 0) > 0 ? (
            <Block
              title={labels.certifications}
              icon={<Award />}
              ink="azure"
              delay={160}
              count={data.certifications?.length}
            >
              <div className="border-t border-line pt-5">
                <CertificationsCard certifications={data.certifications} />
              </div>
            </Block>
          ) : null}

          {(skills?.languages?.length ?? 0) > 0 ? (
            <Block
              title={labels.languages}
              icon={<Languages />}
              ink="azure"
              delay={200}
            >
              <div className="border-t border-line pt-5">
                <TagList items={skills?.languages ?? []} />
              </div>
            </Block>
          ) : null}

          {(data.skills?.length ?? 0) > 0 ||
          (data.passions?.length ?? 0) > 0 ? (
            <Block
              title={labels.interests}
              icon={<Heart />}
              ink="azure"
              delay={240}
            >
              <div className="flex flex-col gap-5 border-t border-line pt-5">
                <Group label={labels.coreSkills} items={data.skills ?? []} />
                <Group label={labels.passions} items={data.passions ?? []} />
              </div>
            </Block>
          ) : null}
        </aside>
      </div>
    </Page>
  );
}
