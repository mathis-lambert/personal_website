"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import BlogArticleCard from "@/components/blog/BlogArticleCard";
import ProjectCard from "@/components/projects/ProjectCard";
import GlassCardsList from "@/components/ui/GlassCardsList";
import { HeroSection } from "@/components/ui/HeroSection";
import type { Article, Project, TimelineEntry } from "@/types";

type HomePageContentProps = {
  featuredProjects: Project[];
  latestArticles: Article[];
  experiences: TimelineEntry[];
  studies: TimelineEntry[];
};

export function HomePageContent({
  featuredProjects,
  latestArticles,
  experiences,
  studies,
}: HomePageContentProps) {
  return (
    <div className="space-y-4">
      <div>
        <HeroSection />
      </div>

      <div>
        <GlassCardsList experiences={experiences} studies={studies} />
      </div>

      <section
        className="mx-auto py-16"
        aria-labelledby="featured-projects"
      >
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-primary">Selected work</p>
            <h2 id="featured-projects" className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Projects with a pulse.</h2>
          </div>
          <Link href="/projects" className="group hidden items-center gap-2 rounded-full border border-foreground/10 bg-card px-4 py-2 text-sm font-black transition-colors hover:bg-secondary/70 sm:flex">All projects <ArrowUpRight className="size-4 transition-transform group-hover:rotate-12" /></Link>
        </div>
        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <ProjectCard key={project._id} project={project} eagerImage />
          ))}
        </div>
        {featuredProjects.length === 0 && (
          <p className="rounded-3xl border border-dashed border-foreground/20 py-12 text-center text-sm text-muted-foreground">
            No projects available yet.
          </p>
        )}
      </section>

      <section
        className="mx-auto pb-20 pt-10"
        aria-labelledby="latest-articles"
      >
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#d95d45]">Field notes</p>
            <h2 id="latest-articles" className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Ideas worth sharing.</h2>
          </div>
          <Link href="/blog" className="group hidden items-center gap-2 rounded-full border border-foreground/10 bg-card px-4 py-2 text-sm font-black transition-colors hover:bg-secondary/70 sm:flex">Read the notes <ArrowUpRight className="size-4 transition-transform group-hover:rotate-12" /></Link>
        </div>
        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {latestArticles.map((article) => (
            <BlogArticleCard
              key={article._id}
              article={article}
              eagerImage
            />
          ))}
        </div>
        {latestArticles.length === 0 && (
          <p className="rounded-3xl border border-dashed border-foreground/20 py-12 text-center text-sm text-muted-foreground">
            No articles available yet.
          </p>
        )}
      </section>
    </div>
  );
}
