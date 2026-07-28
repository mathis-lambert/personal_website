"use client";

import { Boxes, Cpu, Hammer, MapPin, Palette } from "lucide-react";

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

/**
 * Tools I actually reach for, grouped by what they're for. Grouping is the
 * point: a flat marquee of 21 logos told you nothing except that logos exist.
 */
type Tool = { name: string; logo: string; dark?: string };

const toolGroups: {
  heading: string;
  icon: React.ReactNode;
  tools: Tool[];
}[] = [
  {
    heading: "Models & serving",
    icon: <Cpu />,
    tools: [
      { name: "vLLM", logo: LOGOS.vllmColor },
      { name: "NVIDIA", logo: LOGOS.nvidia },
      { name: "Hugging Face", logo: LOGOS.huggingface },
      { name: "Mistral", logo: LOGOS.mistralLight, dark: LOGOS.mistralDark },
      { name: "OpenAI", logo: LOGOS.openaiLight, dark: LOGOS.openaiDark },
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
          <Surface className="overflow-hidden p-6 sm:p-7">
            <div className="grid gap-7 sm:grid-cols-2">
              {toolGroups.map((group) => (
                <div key={group.heading}>
                  <Eyebrow as="h3" className="mb-4">
                    <span className="text-brand [&_svg]:size-3.5">
                      {group.icon}
                    </span>
                    {group.heading}
                  </Eyebrow>
                  <ul className="flex flex-col gap-2.5">
                    {group.tools.map((tool) => (
                      <li
                        key={tool.name}
                        className="group/tool flex items-center gap-3"
                      >
                        {/* Logos sit in a neutral well so their brand colours
                            read as artwork rather than as UI accents. */}
                        <span className="grid size-9 shrink-0 place-items-center rounded-2 border border-line bg-paper-sink transition-colors duration-200 ease-(--ease-paper) group-hover/tool:border-brand-quiet">
                          <SvgIcon
                            path={tool.logo}
                            darkPath={tool.dark}
                            alt=""
                            size={18}
                          />
                        </span>
                        <span className="text-sm font-bold text-ink">
                          {tool.name}
                        </span>
                      </li>
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
