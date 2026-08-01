"use client";

import { Calendar, Clock, Tag as TagIcon } from "lucide-react";
import type React from "react";

import { trackUiEvent } from "@/api/analytics";
import { ContentCard } from "@/components/content/ContentCard";
import { GeneratedEditorialCover } from "@/components/content/GeneratedEditorialCover";
import { formatDate } from "@/lib/format";
import type { Note } from "@/types/content";

const NoteCard: React.FC<{ note: Note; priority?: boolean }> = ({
  note,
  priority = false,
}) => {
  const href = `/notes/${note.slug || note._id}`;


  return (
    <ContentCard
      href={href}
      title={note.title}
      eyebrow={note.tags?.[0] ?? "Note"}
      eyebrowIcon={<TagIcon />}
      description={note.excerpt}
      meta={[
        { icon: <Calendar />, text: formatDate(note.date) },
        typeof note.readTimeMin === "number" && {
          icon: <Clock />,
          text: `${note.readTimeMin} min read`,
        },
      ]}
      tags={note.tags}
      image={note.media?.thumbnailUrl || note.media?.imageUrl}
      imageAlt={`Cover image for ${note.title}`}
      generatedCover={
        <GeneratedEditorialCover
          compact
          kind="note"
          title={note.title}
          eyebrow={note.tags?.[0] ?? "Note"}
          date={formatDate(note.date, "monthYear")}
          details={note.tags}
        />
      }
      priority={priority}
      featured={Boolean(note.isFeatured)}
      cta="Read the note"
      onOpen={() =>
        void trackUiEvent({
          name: "note_open",
          path: href,
          properties: {
            slug: note.slug ?? note._id,
            title: note.title,
          },
        })
      }
    />
  );
};

export default NoteCard;
