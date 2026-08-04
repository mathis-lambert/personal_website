import NotesList from "@/components/notes/NotesList";
import { getAllNotes } from "@/lib/data/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notes - Mathis Lambert",
  description: "Field notes on AI, retrieval and systems, by Mathis Lambert.",
  alternates: { canonical: "/notes" },
};

export default async function NotesPage() {
  const notes = await getAllNotes();
  return <NotesList notes={notes} />;
}
