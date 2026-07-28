import { FileQuestion } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import {
  Display,
  LiftText,
  Eyebrow,
  Lead,
  Meta,
  Page,
  Rule,
  TagList,
} from "@/components/ds";
import Breadcrumb from "@/components/ui/breadcrumb";

/**
 * The shared reading layout for a single project or note: body text directly
 * on the paper, at a fixed reading measure.
 */
export function ReadingShell({
  breadcrumb,
  eyebrow,
  title,
  deck,
  meta = [],
  tags = [],
  cover,
  coverAlt,
  aside,
  children,
  footer,
}: {
  breadcrumb: { label: string; href?: string }[];
  eyebrow?: string;
  title: string;
  deck?: string;
  meta?: (string | undefined)[];
  tags?: string[];
  cover?: string;
  coverAlt?: string;
  /** Actions or metadata pinned under the header (share row, links). */
  aside?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const facts = meta.filter(Boolean) as string[];

  return (
    <article>
      <Page className="pt-10">
        <Breadcrumb items={breadcrumb} />
      </Page>

      <Page narrow as="header" className="pb-12">
        {eyebrow ? (
          <Eyebrow brand className="mb-6">
            {eyebrow}
          </Eyebrow>
        ) : null}

        <Display>{title}</Display>

        {deck ? <Lead className="mt-7">{deck}</Lead> : null}

        {facts.length > 0 ? (
          <Meta as="p" className="mt-8">
            {facts.join(" · ")}
          </Meta>
        ) : null}

        {tags.length > 0 ? <TagList items={tags} className="mt-5" /> : null}

        {aside ? <div className="mt-9">{aside}</div> : null}

        <Rule className="mt-12" />
      </Page>

      {cover ? (
        <Page className="pb-14">
          <div className="frame relative aspect-[16/9] w-full">
            <Image
              src={cover}
              alt={coverAlt ?? ""}
              fill
              priority
              sizes="(max-width: 1200px) 92vw, 72rem"
              className="object-cover"
            />
          </div>
        </Page>
      ) : null}

      <Page narrow className="pb-20">
        {children}
      </Page>

      {footer ? <Page narrow className="pb-28">{footer}</Page> : null}
    </article>
  );
}

/** A labelled block inside a detail page body. */
export function DetailSection({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <Eyebrow as="h2" className="mb-5">
        {icon ? (
          <span className="text-brand [&_svg]:size-3.5">{icon}</span>
        ) : null}
        {title}
      </Eyebrow>
      {children}
    </section>
  );
}

/** Standard empty/not-found state for a detail route. */
export function DetailNotFound({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action: ReactNode;
}) {
  return (
    <Page narrow className="grid min-h-[60vh] place-items-center py-24">
      <div className="text-center">
        <span className="mx-auto mb-6 grid size-12 place-items-center rounded-full bg-brand-wash text-brand [&_svg]:size-5">
          <FileQuestion />
        </span>
        <Eyebrow brand className="mb-4 justify-center">
          Nothing here
        </Eyebrow>
        <LiftText as="h1" className="t-h1">
          {title}
        </LiftText>
        <p className="t-lead mx-auto mt-5">{hint}</p>
        <div className="mt-9 flex justify-center">{action}</div>
      </div>
    </Page>
  );
}
