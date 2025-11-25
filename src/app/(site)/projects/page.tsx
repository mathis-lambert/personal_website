import ProjectsList from "@/components/projects/ProjectsList";
import { getAllProjects } from "@/lib/data/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projects - Mathis Lambert",
  description: "Selected projects and case studies.",
};

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  return <ProjectsList projects={projects} />;
}
