import { ArrowRight, FolderOpen, PenLine } from "lucide-react";

import NoteCard from "@/components/notes/NoteCard";
import {
  ActionLink,
  CardGrid,
  EmptyState,
  Page,
  Reveal,
  Section,
  SectionHeader,
} from "@/components/ds";
import { AskBand } from "@/components/home/AskBand";
import { Path } from "@/components/home/Path";
import { Workshop } from "@/components/home/Workshop";
import ProjectCard from "@/components/projects/ProjectCard";
import { HeroSection } from "@/components/home/HeroSection";
import type { Note, Project, TimelineEntry } from "@/types/content";

type HomePageContentProps = {
  featuredProjects: Project[];
  latestNotes: Note[];
  experiences: TimelineEntry[];
  studies: TimelineEntry[];
};

const seeAll = (label: string, href: string) => (
  <ActionLink href={href}>
    {label}
    <ArrowRight className="size-4 transition-transform duration-200 ease-(--ease-paper) group-hover/link:translate-x-1" />
  </ActionLink>
);

/**
 * Home, ordered by what a visitor came for.
 *
 * The work now sits directly under the hero. Previously the biography came
 * first and three sections had to be scrolled before a single project appeared,
 * which is backwards for a portfolio: the CV answers "is he credible", but only
 * after the work has made someone want to ask.
 *
 * Each section carries one of the five inks via `data-ink`, so colour tracks
 * section identity instead of decorating.
 */
export function HomePageContent({
  featuredProjects,
  latestNotes,
  experiences,
  studies,
}: HomePageContentProps) {
  return (
    <>
      <HeroSection />

      <Page as="div" data-ink="coral">
        <Section labelledBy="featured-projects">
          <SectionHeader
            eyebrow="Selected work"
            icon={<FolderOpen />}
            title="Things I've made, broken, and made better."
            titleId="featured-projects"
            deck="Each one is written up with the decisions behind it, not just the screenshots."
            action={seeAll("All projects", "/projects")}
          />
          {featuredProjects.length > 0 ? (
            <CardGrid>
              {featuredProjects.map((project, index) => (
                <Reveal key={project._id} delay={Math.min(index, 3) * 80}>
                  <ProjectCard project={project} priority={index === 0} />
                </Reveal>
              ))}
            </CardGrid>
          ) : (
            <EmptyState title="Nothing published yet." />
          )}
        </Section>
      </Page>

      <Path experiences={experiences} studies={studies} />

      <Workshop />

      <Page as="div" data-ink="azure">
        <Section labelledBy="latest-notes">
          <SectionHeader
            eyebrow="Field notes"
            icon={<PenLine />}
            title="Thinking out loud, mostly about systems."
            titleId="latest-notes"
            deck="What I learned the hard way, written down before I forget it."
            action={seeAll("All notes", "/notes")}
          />
          {latestNotes.length > 0 ? (
            <CardGrid>
              {latestNotes.map((note, index) => (
                <Reveal key={note._id} delay={Math.min(index, 3) * 80}>
                  <NoteCard note={note} />
                </Reveal>
              ))}
            </CardGrid>
          ) : (
            <EmptyState title="No notes yet." />
          )}
        </Section>
      </Page>

      <AskBand />
    </>
  );
}
