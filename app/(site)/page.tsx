import {
  getAllNotes,
  getAllProjects,
  getExperiences,
  getStudies,
} from "@/lib/data/content";
import type { Note, Project } from "@/types/content";
import { HomePageContent } from "@/components/home/HomePageContent";
import { byNewest } from "@/lib/content/sort";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [projects, notes, experiences, studies] = await Promise.all([
    getAllProjects(),
    getAllNotes(),
    getExperiences(),
    getStudies(),
  ]);

  const featuredProjects: Project[] = (() => {
    const featured = projects.filter((p) => p.isFeatured);
    const pool = featured.length ? featured : projects;
    return [...pool].sort(byNewest).slice(0, 3);
  })();

  const latestNotes: Note[] = [...notes].sort(byNewest).slice(0, 3);

  return (
    <HomePageContent
      featuredProjects={featuredProjects}
      latestNotes={latestNotes}
      experiences={experiences}
      studies={studies}
    />
  );
}
