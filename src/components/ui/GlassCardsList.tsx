"use client";
import GlassCardHero from "@/components/ui/GlassCardHero";
import ToolCarousel from "@/components/ui/ToolCarousel";
import { ScrollableTimeline } from "@/components/ui/ScrollableTimeline";
import WidgetTechnologyChip from "@/components/ui/WidgetTechnologyChip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { ArrowRight, MapPin, MessageCircle, Navigation, Sparkles } from "lucide-react";
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
      <GlassCardHero title="Location" px={0} pt={0} animationDelay={0.05} className="bg-[#79a7d3]/20">
        <div className="relative flex h-full w-full items-end overflow-hidden bg-[radial-gradient(circle_at_30%_30%,rgba(121,167,211,0.35),transparent_55%)] p-5">
          <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="absolute right-[26%] top-[30%]">
            <span className="absolute -inset-4 animate-ping rounded-full bg-[#e76f51]/25" />
            <span className="relative grid size-12 place-items-center rounded-full bg-[#e76f51] text-white shadow-lg"><MapPin className="size-5" /></span>
          </div>
          <div className="relative flex w-full items-end justify-between gap-4">
            <div>
              <p className="font-display text-2xl font-semibold">Marseille</p>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">South of France · 43.2965° N</p>
            </div>
            <Navigation className="size-5 text-primary" />
          </div>
        </div>
      </GlassCardHero>

      <GlassCardHero title="Favourite tools" px={0} size="medium" animationDelay={0.1} className="bg-[#f6bd60]/15">
        <ToolCarousel />
      </GlassCardHero>

      <GlassCardHero title="Experience" px={0} size="medium" animationDelay={0.15} className="bg-[#f28482]/15">
        <ScrollableTimeline
          data={experiences}
          showGradients={false}
          accentColor={"#FF6F61"}
          scrollSpeed={2}
          wheelSensitivity={1}
        />
      </GlassCardHero>

      <GlassCardHero title="Studies" px={0} animationDelay={0.2} className="bg-[#50b5a4]/15">
        <ScrollableTimeline
          data={studies}
          showGradients={false}
          accentColor={"#4A90E2"}
          scrollSpeed={2}
          wheelSensitivity={1}
        />
      </GlassCardHero>

      <GlassCardHero title="Top skills" px={1} size="small" animationDelay={0.25}>
        <ScrollArea className="h-48 thin-scrollbar pr-1 w-full">
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 gap-2 pr-1 pb-14 sm:pb-10 md:pb-8 lg:pb-6 ">
            {topSkills.map((tech) => (
              <WidgetTechnologyChip key={tech} technology={tech} />
            ))}
          </div>
        </ScrollArea>
      </GlassCardHero>

      <GlassCardHero title="Interactive portfolio" size="small" animationDelay={0.3} className="bg-foreground text-background dark:bg-[#f6bd60] dark:text-[#263238]">
        <div className="flex flex-col gap-5 sm:gap-6 pb-4 pr-1 h-full justify-between">
          <Sparkles className="size-6 text-accent dark:text-[#d95d45]" />
          <p className="text-sm sm:text-base opacity-85 leading-relaxed font-bold">
            Skip the scrolling. Ask my AI persona about my work, skills, or experience.
          </p>
          <Button
            onClick={openChat}
            aria-label="Start portfolio chat"
            size="lg"
            className="w-fit !rounded-xl !bg-primary !text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Start chat
            <MessageCircle className="size-4" />
          </Button>
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
