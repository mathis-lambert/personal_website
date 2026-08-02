import { getProjectBySlug } from "@/lib/data/content";
import { formatDate } from "@/lib/format";
import {
  SHARE_IMAGE_CONTENT_TYPE,
  SHARE_IMAGE_SIZE,
  renderShareImage,
} from "@/lib/og/share-image";
import { SITE_URL } from "@/lib/site";

export const alt = "Project by Mathis Lambert";
export const size = SHARE_IMAGE_SIZE;
export const contentType = SHARE_IMAGE_CONTENT_TYPE;

export const dynamic = "force-dynamic";

export default async function ProjectShareImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  return renderShareImage(
    {
      kind: "project",
      // An unresolved slug still gets an image: a crawler racing a rename
      // should unfurl something on brand, not a 500.
      title: project?.title ?? "Project",
      cover: project?.media?.imageUrl || project?.media?.thumbnailUrl,
      date: formatDate(project?.date, "monthYear"),
      details: project?.technologies ?? [],
      seed: slug,
    },
    SITE_URL,
  );
}
