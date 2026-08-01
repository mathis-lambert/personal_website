"use client";

import {
  ArrowRight,
  Building2,
  GraduationCap,
  MapPin,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import {
  Action,
  Eyebrow,
  LiftText,
  Page,
  Reveal,
  Squiggle,
  TokenStream,
} from "@/components/ds";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

/**
 * Readings, set in mono like everything factual on this site.
 *
 * Three facts, three inks. One shared colour turned the row into a wall of
 * identical grey-blue rows that read as a single paragraph broken into thirds;
 * giving each its own ink makes it obvious at a glance that these are three
 * separate things, and where one ends. The ink lands on the icon and the label,
 * never on the value: the fact itself stays black so it stays readable.
 */
const readings: {
  icon: ReactNode;
  label: string;
  value: string;
  ink: string;
}[] = [
  {
    icon: <Building2 />,
    label: "Now",
    value: "AI engineer at Free Pro",
    ink: "azure",
  },
  {
    icon: <GraduationCap />,
    label: "Studying",
    value: "AI & software, CPE Lyon",
    ink: "turquoise",
  },
  {
    icon: <MapPin />,
    label: "Based in",
    value: "Marseille, 43.30°N",
    ink: "saffron",
  },
];

export const HeroSection = () => {
  const { openChat } = useChat();

  return (
    <Page as="section" data-ink="azure" className="pb-10 pt-8 sm:pb-12 sm:pt-10">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <Reveal>
            {/* Saffron, not green and not red. Green reads "available", red
                reads "don't bother"; neither is true. He is in an alternance
                through 2027, which is amber: taken, with a known end date. The
                text says so outright, because a coloured dot on its own is a
                guess the visitor has to make. */}
            <div data-ink="saffron">
              <Eyebrow brand className="mb-6">
                <span className="relative flex size-1.5">
                  <span className="absolute size-1.5 animate-ping rounded-full bg-brand opacity-70" />
                  <span className="relative size-1.5 rounded-full bg-brand" />
                </span>
                Engineering student at CPE Lyon, graduating in 2027 
              </Eyebrow>
            </div>
          </Reveal>

          {/* The name is the stable, human thing, so it gets the pointer lift.
              The line describing him is the one the machine writes, so it gets
              the token stream. */}
          <Reveal delay={60}>
            <h1 id="hero-title" className="t-display">
              <LiftText>Mathis Lambert</LiftText>
              <span className="text-coral">.</span>
            </h1>
          </Reveal>

          <TokenStream
            as="p"
            className="t-lead mt-6"
            startDelay={520}
            segments={[
              "Software engineer. I build ",
              { mark: "AI systems" },
              ", agentic workflows and data pipelines.",
            ]}
          />

          <Reveal delay={440}>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Action href="/projects" tone="ink" size="lg">
                See the work
                <ArrowRight className="transition-transform duration-200 ease-(--ease-paper) group-hover/action:translate-x-1" />
              </Action>
              <Action onClick={openChat} size="lg">
                <MessageCircle /> Ask my portfolio
              </Action>
            </div>
          </Reveal>
        </div>

        {/* Portrait leads on mobile: a face opens a small screen better than a
            paragraph does. */}
        <Reveal
          delay={120}
          as="figure"
          className="group relative order-first mx-auto my-0 w-full max-w-[15rem] sm:max-w-[17rem] lg:order-none lg:max-w-[21rem]"
        >
          <div
            aria-hidden="true"
            className="arch absolute inset-0 translate-x-2.5 translate-y-2.5 border border-line-strong transition-transform duration-500 ease-(--ease-paper) group-hover:translate-x-1 group-hover:translate-y-1"
          />
          <div className="arch relative aspect-[4/5] overflow-hidden bg-paper-sink">
            <Image
              src="/images/mathis.jpg"
              alt="Mathis Lambert"
              fill
              priority
              sizes="(max-width: 640px) 60vw, (max-width: 1024px) 34vw, 21rem"
              className="object-cover object-[62%_center]"
            />
          </div>
        </Reveal>
      </div>

      {/* The readings run the full width under both columns. Stacked beneath the
          copy they made the left side top-heavy while the portrait sat alone on
          the right; as a footer row they close the block instead.

          The divider above them is drawn rather than ruled. A straight hairline
          here was a full stop; a wave has a direction, so it reads as the page
          carrying on. */}
      <div className="mt-12">
        <Squiggle delay={560} className="text-brand-quiet" />

        <Reveal delay={620}>
          <dl className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-3">
            {readings.map((reading, index) => (
              <div
                key={reading.label}
                data-ink={reading.ink}
                className={cn(
                  "flex items-start gap-3.5",
                  index > 0 && "sm:border-l sm:border-line sm:pl-8",
                )}
              >
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-3 bg-brand-wash text-brand [&_svg]:size-[1.05rem]"
                >
                  {reading.icon}
                </span>
                <div className="min-w-0">
                  <dt className="t-eyebrow mb-1.5 text-brand">
                    {reading.label}
                  </dt>
                  <dd className="text-[0.9375rem] font-bold leading-snug text-ink">
                    {reading.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </Page>
  );
};
