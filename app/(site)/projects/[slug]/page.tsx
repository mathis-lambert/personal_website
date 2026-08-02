import ProjectView from "@/components/projects/ProjectView";
import { requireAdminSession } from "@/lib/auth/helpers";
import { getProjectBySlug } from "@/lib/data/content";
import type { Project } from "@/types/content";
import { notFound } from "next/navigation";

type Params = { slug: string };

export const dynamic = "force-dynamic";

/** No `openGraph.images` here on purpose: it would override `opengraph-image.tsx`. */
export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  const description = project.subtitle || project.description;
  return {
    title: `${project.title} – Project`,
    description,
    openGraph: {
      title: project.title,
      description,
      type: "article" as const,
      url: `/projects/${project.slug || project._id}`,
    },
    twitter: { card: "summary_large_image" as const },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const [project, canEdit] = await Promise.all([
    getProjectBySlug(slug) as Promise<Project | null>,
    requireAdminSession(),
  ]);
  if (!project) {
    notFound();
  }
  return <ProjectView project={project} canEdit={canEdit} />;
}
