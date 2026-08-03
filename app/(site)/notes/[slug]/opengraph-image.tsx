import { getNoteBySlug } from "@/lib/data/content";
import { formatDate } from "@/lib/format";
import {
  SHARE_IMAGE_CONTENT_TYPE,
  SHARE_IMAGE_SIZE,
  renderShareImage,
} from "@/lib/og/share-image";
import { SITE_URL } from "@/lib/site";

export const alt = "Note by Mathis Lambert";
export const size = SHARE_IMAGE_SIZE;
export const contentType = SHARE_IMAGE_CONTENT_TYPE;

// Content changes are uncommon; let Next reuse generated images instead of
// invoking Satori and Sharp for every crawler request.
export const revalidate = 3600;

export default async function NoteShareImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);

  return renderShareImage(
    {
      kind: "note",
      // An unresolved slug still gets an image: a crawler racing a rename
      // should unfurl something on brand, not a 500.
      title: note?.title ?? "Note",
      cover: note?.media?.imageUrl || note?.media?.thumbnailUrl,
      date: formatDate(note?.date, "monthYear"),
      details: note?.tags ?? [],
      seed: slug,
    },
    SITE_URL,
  );
}
