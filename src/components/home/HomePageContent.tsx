"use client";

import { motion, type Variants } from "framer-motion";

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

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.05,
      staggerChildren: 0.12,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export function HomePageContent({
  featuredProjects,
  latestArticles,
  experiences,
  studies,
}: HomePageContentProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12"
    >
      <motion.div variants={fadeUp}>
        <HeroSection />
      </motion.div>

      <motion.div variants={fadeUp}>
        <GlassCardsList experiences={experiences} studies={studies} />
      </motion.div>

      <motion.section
        variants={fadeUp}
        className="max-w-7xl mx-auto py-10"
        aria-labelledby="featured-projects"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="featured-projects" className="text-2xl font-semibold">
            Featured Projects
          </h2>
        </div>
        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((p, i) => (
            <ProjectCard key={p._id} project={p} animationDelay={i * 0.08} />
          ))}
        </div>
        {featuredProjects.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            No projects available yet.
          </p>
        )}
      </motion.section>

      <motion.section
        variants={fadeUp}
        className="max-w-7xl mx-auto pb-16"
        aria-labelledby="latest-articles"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="latest-articles" className="text-2xl font-semibold">
            Latest Articles
          </h2>
        </div>
        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {latestArticles.map((a, i) => (
            <BlogArticleCard
              key={a._id}
              article={a}
              animationDelay={i * 0.08}
            />
          ))}
        </div>
        {latestArticles.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            No articles available yet.
          </p>
        )}
      </motion.section>
    </motion.div>
  );
}
