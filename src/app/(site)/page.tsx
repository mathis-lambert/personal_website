import {
  getAllArticles,
  getAllProjects,
  getExperiences,
  getStudies,
} from "@/lib/data/content";
import type { Article, Project } from "@/types";
import { HomePageContent } from "@/components/home/HomePageContent";

const byDateDesc = (a: { date?: string }, b: { date?: string }) =>
  new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime();

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [projects, articles, experiences, studies] = await Promise.all([
    getAllProjects(),
    getAllArticles(),
    getExperiences(),
    getStudies(),
  ]);

  const featuredProjects: Project[] = (() => {
    const featured = projects.filter((p) => p.isFeatured);
    const pool = featured.length ? featured : projects;
    return [...pool].sort(byDateDesc).slice(0, 3);
  })();

  const latestArticles: Article[] = [...articles].sort(byDateDesc).slice(0, 3);

  return (
    <HomePageContent
      featuredProjects={featuredProjects}
      latestArticles={latestArticles}
      experiences={experiences}
      studies={studies}
    />
  );
}
