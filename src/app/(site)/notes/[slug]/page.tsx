import NoteView from "@/components/notes/NoteView";
import { getNoteBySlug } from "@/lib/data/content";
import type { Note } from "@/types";
import { notFound } from "next/navigation";

type Params = { slug: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) return { title: "Note not found" };
  return {
    title: `${note.title} · Notes`,
    description: note.excerpt,
  };
}

export default async function NoteDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const note = (await getNoteBySlug(slug)) as Note | null;
  if (!note) {
    notFound();
  }
  return <NoteView note={note} />;
}
