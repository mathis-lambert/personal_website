"use client";

import {
  Boxes,
  Cpu,
  Hammer,
  MapPin,
  Palette,
  TerminalSquare,
} from "lucide-react";

import {
  Eyebrow,
  Page,
  Reveal,
  Section,
  SectionHeader,
  Surface,
} from "@/components/ds";
import { LocationMap } from "@/components/ui/LocationMap";
import SvgIcon from "@/components/ui/SvgIcon";
import { LOGOS } from "@/components/ui/logos";
import { ToolQuip } from "@/components/home/ToolQuip";
import { cn } from "@/lib/utils";

type Tool = {
  name: string;
  logo: string;
  dark?: string;
  /** Hovering cycles through these, streamed in one at a time. */
  quips?: string[];
};

const toolGroups: {
  heading: string;
  icon: React.ReactNode;
  tools: Tool[];
}[] = [
  {
    heading: "Coding",
    icon: <TerminalSquare />,
    tools: [
      {
        name: "Codex",
        logo: LOGOS.openaiLight,
        dark: LOGOS.openaiDark,
        quips: [
          "second opinion",
          "for when the first one lies",
          "tests, allegedly \u{1F91E}",
          "it's 2026",
          "reviewed by a rival \u{1F440}",
          "ships at 2am \u{1F319}",
          "\u{1F480}",
          "no notes",
          "the tabs stay open",
          "asked it twice, same answer, shipped",
        ],
      },
      {
        name: "Claude Code",
        logo: LOGOS.claude,
        quips: [
          "wrote this list",
          "and this quip \u{1F643}",
          "we don't talk about the git history",
          "yes, it reviewed itself",
          "sue me",
          "read the whole repo, twice \u{1F9E0}",
          "blames the linter \u{1F9F9}",
          "\u{1F602} it's fine",
          "'just one more refactor'",
          "somehow also wrote the migration",
        ],
      },
    ],
  },
  {
    heading: "Models & serving",
    icon: <Cpu />,
    tools: [
      { name: "vLLM", logo: LOGOS.vllmColor },
      { name: "NVIDIA", logo: LOGOS.nvidia },
      { name: "Hugging Face", logo: LOGOS.huggingface },
      { name: "Mistral", logo: LOGOS.mistralLight, dark: LOGOS.mistralDark },
      { name: "OpenAI", logo: LOGOS.openaiLight, dark: LOGOS.openaiDark },
      { name: "LangChain", logo: LOGOS.langchain },
      { name: "LangGraph", logo: LOGOS.langgraph },
    ],
  },
  {
    heading: "Backend & data",
    icon: <Boxes />,
    tools: [
      { name: "Python", logo: LOGOS.python },
      { name: "FastAPI", logo: LOGOS.fastapi },
      { name: "MongoDB", logo: LOGOS.mongodb },
      { name: "Qdrant", logo: LOGOS.qdrant },
      { name: "Docker", logo: LOGOS.docker },
      { name: "Linux", logo: LOGOS.linux },
    ],
  },
  {
    heading: "Interface",
    icon: <Palette />,
    tools: [
      { name: "TypeScript", logo: LOGOS.typescript },
      { name: "React", logo: LOGOS.react },
      { name: "Tailwind", logo: LOGOS.tailwind },
      { name: "Figma", logo: LOGOS.figma },
    ],
  },
];

export function Workshop() {
  return (
    <Page as="div" data-ink="coral">
      <Section id="workshop" labelledBy="workshop-title">
        <SectionHeader
          eyebrow="The workshop"
          icon={<Hammer />}
          title="What I build with, and where."
          titleId="workshop-title"
          deck="A small stack rather than a long list. These are the tools I know well enough to debug at 2am."
        />

        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Columns, not a grid: the groups run 2 to 7 tools long, and a grid
              aligns their rows, leaving dead space under the short ones. */}
          <Surface className="overflow-hidden p-6 sm:p-7">
            <div className="gap-x-8 sm:columns-2">
              {toolGroups.map((group) => (
                <div
                  key={group.heading}
                  className="mb-7 break-inside-avoid last:mb-0"
                >
                  <Eyebrow as="h3" className="mb-4">
                    <span className="text-brand [&_svg]:size-3.5">
                      {group.icon}
                    </span>
                    {group.heading}
                  </Eyebrow>
                  <ul className="flex flex-col gap-2.5">
                    {group.tools.map((tool) => (
                      <ToolQuip
                        key={tool.name}
                        name={tool.name}
                        quips={tool.quips ?? []}
                      >
                        <span
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-2 border border-line bg-paper-sink group-hover/tool:border-brand-quiet",
                            // `transition-colors` omits transform and would win
                            // on layer order, so `.tool-spin` transitions alone.
                            tool.quips
                              ? "tool-spin"
                              : "transition-colors duration-200 ease-(--ease-paper)",
                          )}
                        >
                          <SvgIcon
                            path={tool.logo}
                            darkPath={tool.dark}
                            alt=""
                            size={18}
                          />
                        </span>
                      </ToolQuip>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Surface>

          <Reveal delay={80}>
            <Surface flip className="flex h-full flex-col overflow-hidden">
              <div className="relative min-h-56 flex-1">
                <LocationMap />
              </div>
              <div className="border-t border-line px-6 py-5">
                <Eyebrow className="mb-2">
                  <MapPin className="size-3 text-brand" />
                  Based in
                </Eyebrow>
                <p className="t-h3">Marseille, France</p>
                <p className="t-meta mt-1.5">
                  Remote-friendly · CET · happy to travel
                </p>
              </div>
            </Surface>
          </Reveal>
        </div>
      </Section>
    </Page>
  );
}
