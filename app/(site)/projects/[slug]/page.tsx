import ProjectView from "@/components/projects/ProjectView";
import { JsonLd } from "@/components/seo/JsonLd";
import { requireAdminSession } from "@/lib/auth/helpers";
import { getProjectBySlug } from "@/lib/data/content";
import { SITE_URL } from "@/lib/site";
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
  const path = `/projects/${project.slug || project._id}`;
  return {
    title: `${project.title} – Project`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: project.title,
      description,
      type: "article" as const,
      url: path,
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
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: project.title,
          description: project.subtitle || project.description,
          url: `${SITE_URL}/projects/${project.slug || project._id}`,
          datePublished: project.publishedAt ?? project.date,
          dateModified: project.updatedAt ?? project.publishedAt ?? project.date,
          keywords: project.technologies,
          image: project.media?.imageUrl || project.media?.thumbnailUrl,
          author: { "@id": `${SITE_URL}/#person` },
        }}
      />
      <ProjectView project={project} canEdit={canEdit} />
    </>
  );
}
