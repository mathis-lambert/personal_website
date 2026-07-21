"use client";
import GlassCardHero from "@/components/ui/GlassCardHero";
import ToolCarousel from "@/components/ui/ToolCarousel";
import { ScrollableTimeline } from "@/components/ui/ScrollableTimeline";
import WidgetTechnologyChip from "@/components/ui/WidgetTechnologyChip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { LocationMap } from "@/components/ui/LocationMap";
import { useChat } from "@/hooks/useChat";
import { ArrowRight, Bot, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import type { TimelineEntry } from "@/types";

const GlassCardsList = ({
  experiences,
  studies,
}: {
  experiences: TimelineEntry[];
  studies: TimelineEntry[];
}) => {
  const { openChat } = useChat();

  const topSkills = [
    "LLMs",
    "Python",
    "vLLM",
    "CUDA",
    "NVIDIA",
    "Docker",
    "TypeScript",
    "MongoDB",
    "Qdrant",
  ];

  return (
    <section id="now" className="scroll-mt-28 py-16" aria-labelledby="now-title">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-primary">A little more context</p>
          <h2 id="now-title" className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">What I&apos;m into, right now.</h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">The tools, places, and experiences shaping how I think and build.</p>
      </div>
      <div className="grid auto-rows-[220px] grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[250px]">
      <GlassCardHero title="Location" px={0} pt={0} className="bg-[#79a7d3]/20">
        <LocationMap />
      </GlassCardHero>

      <GlassCardHero title="Favourite tools" px={0} size="medium" className="bg-[#f6bd60]/15">
        <ToolCarousel />
      </GlassCardHero>

      <GlassCardHero title="Experience" px={0} size="medium" className="bg-[#f28482]/15">
        <ScrollableTimeline
          data={experiences}
          showGradients={false}
          accentColor={"#FF6F61"}
        />
      </GlassCardHero>

      <GlassCardHero title="Studies" px={0} className="bg-[#50b5a4]/15">
        <ScrollableTimeline
          data={studies}
          showGradients={false}
          accentColor={"#4A90E2"}
        />
      </GlassCardHero>

      <GlassCardHero title="Top skills" px={1} size="small">
        <ScrollArea className="h-48 thin-scrollbar pr-1 w-full">
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 gap-2 pr-1 pb-14 sm:pb-10 md:pb-8 lg:pb-6 ">
            {topSkills.map((tech) => (
              <WidgetTechnologyChip key={tech} technology={tech} />
            ))}
          </div>
        </ScrollArea>
      </GlassCardHero>

      <GlassCardHero title="Interactive portfolio" px={0} pt={0} size="small">
        <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#14373c] px-5 pb-5 pt-[4.25rem] text-[#fffaf0]">
          <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full border-[28px] border-[#49a493]/25" />
          <div className="pointer-events-none absolute -bottom-14 -left-10 size-36 rounded-full bg-[#ef6c4d]/20 blur-2xl" />

          <div className="relative">
            <div className="mb-3 flex items-center gap-2 text-[#ff8a65]">
              <span className="grid size-8 place-items-center rounded-xl bg-[#ff8a65]/15">
                <Bot className="size-4" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a8ddd2]">
                Online · knows this portfolio
              </span>
            </div>
            <p className="font-display text-2xl font-semibold leading-[1.05]">
              Ask the work itself.
            </p>
            <p className="mt-2 max-w-[28ch] text-sm font-bold leading-relaxed text-[#d8e8e4]">
              Projects, AI systems, skills—get a direct answer and the right link.
            </p>
          </div>

          <Button
            onClick={openChat}
            aria-label="Start portfolio chat"
            size="lg"
            className="relative w-full !rounded-2xl !bg-[#fffaf0] !text-[#14373c] shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5 hover:!bg-white"
          >
            Ask my portfolio
            <MessageCircle className="size-4" />
          </Button>
          <Sparkles className="pointer-events-none absolute right-5 top-[4.4rem] size-5 rotate-12 text-[#f6bd60]" />
        </div>
      </GlassCardHero>
      </div>
      <div className="mt-6 flex justify-end">
        <Link href="/resume" className="group inline-flex items-center gap-2 text-sm font-black text-muted-foreground transition-colors hover:text-foreground">See the full story <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
      </div>
    </section>
  );
};

export default GlassCardsList;
