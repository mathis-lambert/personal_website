import NoteView from "@/components/notes/NoteView";
import { JsonLd } from "@/components/seo/JsonLd";
import { requireAdminSession } from "@/lib/auth/helpers";
import { getNoteBySlug } from "@/lib/data/content";
import { SITE_URL } from "@/lib/site";
import type { Note } from "@/types/content";
import { notFound } from "next/navigation";

type Params = { slug: string };

export const dynamic = "force-dynamic";

/** No `openGraph.images` here on purpose: it would override `opengraph-image.tsx`. */
export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) return { title: "Note not found" };
  const path = `/notes/${note.slug || note._id}`;
  return {
    title: `${note.title} · Notes`,
    description: note.excerpt,
    alternates: { canonical: path },
    openGraph: {
      title: note.title,
      description: note.excerpt,
      type: "article" as const,
      url: path,
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
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: note.title,
          description: note.excerpt,
          url: `${SITE_URL}/notes/${note.slug || note._id}`,
          datePublished: note.publishedAt ?? note.date,
          dateModified: note.updatedAt ?? note.publishedAt ?? note.date,
          keywords: note.tags,
          image: note.media?.imageUrl || note.media?.thumbnailUrl,
          author: note.author
            ? { "@type": "Person", name: note.author }
            : { "@id": `${SITE_URL}/#person` },
        }}
      />
      <NoteView note={note} canEdit={canEdit} />
    </>
  );
}
