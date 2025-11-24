import ProjectView from '@/components/projects/ProjectView';
import { getAllProjects, getProjectBySlug } from '@/lib/data/content';
import type { Project } from '@/types';
import { notFound } from 'next/navigation';

type Params = { slug: string };

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects
    .filter((p) => p.slug)
    .map((p) => ({ slug: p.slug! }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) return { title: 'Project not found' };
  return {
    title: `${project.title} – Project`,
    description: project.subtitle || project.description,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Params;
}) {
  const project = (await getProjectBySlug(params.slug)) as Project | null;
  if (!project) {
    notFound();
  }
  return <ProjectView project={project} />;
}
