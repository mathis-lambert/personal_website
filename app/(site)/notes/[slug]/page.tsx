import NoteView from "@/components/notes/NoteView";
import { requireAdminSession } from "@/lib/auth/helpers";
import { getNoteBySlug } from "@/lib/data/content";
import type { Note } from "@/types/content";
import { notFound } from "next/navigation";

type Params = { slug: string };

export const dynamic = "force-dynamic";

/** No `openGraph.images` here on purpose: it would override `opengraph-image.tsx`. */
export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) return { title: "Note not found" };
  return {
    title: `${note.title} · Notes`,
    description: note.excerpt,
    openGraph: {
      title: note.title,
      description: note.excerpt,
      type: "article" as const,
      url: `/notes/${note.slug || note._id}`,
    },
    twitter: { card: "summary_large_image" as const },
  };
}

export default async function NoteDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const [note, canEdit] = await Promise.all([
    getNoteBySlug(slug) as Promise<Note | null>,
    requireAdminSession(),
  ]);
  if (!note) {
    notFound();
  }
  return <NoteView note={note} canEdit={canEdit} />;
}
