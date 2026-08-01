"use client";

import { ArrowUpRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Surface, TagList } from "@/components/ds";
import { cn } from "@/lib/utils";

type CardMeta = { icon?: ReactNode; text: string };

export type ContentCardProps = {
  href: string;
  title: string;
  description?: string;
  /** Kicker above the title, with its own icon: "Case study", "In progress". */
  eyebrow?: string;
  eyebrowIcon?: ReactNode;
  /** Short facts, each with an icon so the row is scannable without reading. */
  meta?: (CardMeta | false | null | undefined | "")[];
  tags?: string[];
  image?: string;
  imageAlt?: string;
  generatedCover?: ReactNode;
  priority?: boolean;
  sizes?: string;
  featured?: boolean;
  /** The verb on the call to action: "Read the write-up", "Read the note". */
  cta?: string;
  onOpen?: () => void;
  /** Secondary links (repo, demo). Rendered outside the main anchor. */
  actions?: ReactNode;
  className?: string;
};

/**
 * The one content card, used by both projects and notes.
 *
 * The whole card is a real anchor, so middle-click, cmd-click and link preview
 * all work; secondary links live in a sibling row rather than nested inside it.
 */
export function ContentCard({
  href,
  title,
  description,
  eyebrow,
  eyebrowIcon,
  meta = [],
  tags = [],
  image,
  imageAlt,
  generatedCover,
  priority = false,
  sizes = "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 22rem",
  featured = false,
  cta = "Read on",
  onOpen,
  actions,
  className,
}: ContentCardProps) {
  const facts = meta.filter(Boolean) as CardMeta[];

  return (
    <Surface
      as="article"
      interactive
      className={cn("group flex h-full flex-col overflow-hidden", className)}
    >
      <Link
        href={href}
        onClick={onOpen}
        className="flex flex-1 flex-col no-underline outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        {image || generatedCover ? (
          <div className="frame r-stone-inset-top relative m-2.5 mb-0 h-40 sm:h-44">
            {image ? (
              <Image
                src={image}
                alt={imageAlt ?? ""}
                fill
                sizes={sizes}
                priority={priority}
                className="object-cover"
              />
            ) : (
              generatedCover
            )}
            {featured ? (
              <span className="tag absolute left-2.5 top-2.5 gap-1 border-coral/35 bg-paper-lift/90 text-coral backdrop-blur-sm">
                <Star className="size-3" /> Featured
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-1 flex-col p-5">
          {eyebrow ? (
            <p className="t-eyebrow mb-2.5">
              {eyebrowIcon ? (
                <span className="text-brand [&_svg]:size-3">{eyebrowIcon}</span>
              ) : null}
              {eyebrow}
            </p>
          ) : null}

          <h3 className="t-h3 text-balance">{title}</h3>

          {description ? (
            <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
          ) : null}

          {facts.length > 0 ? (
            <ul className="mt-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
              {facts.map((fact) => (
                <li
                  key={fact.text}
                  className="t-meta flex items-center gap-1.5 [&_svg]:size-3 [&_svg]:text-ink-faint"
                >
                  {fact.icon}
                  {fact.text}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-auto pt-4">
            {tags.length > 0 ? <TagList items={tags} max={3} /> : null}

            <span className="mt-4 inline-flex items-center gap-1.5 border-b border-transparent pb-0.5 text-sm font-bold text-ink transition-colors duration-200 ease-(--ease-paper) group-hover:border-brand">
              {cta}
              <ArrowUpRight className="size-3.5 text-brand transition-transform duration-200 ease-(--ease-paper) group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>

      {actions ? (
        <div className="flex items-center gap-1 border-t border-line px-3.5 py-2">
          {actions}
        </div>
      ) : null}
    </Surface>
  );
}
