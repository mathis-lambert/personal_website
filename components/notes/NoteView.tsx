"use client";

import { PencilLine } from "lucide-react";
import type React from "react";

import {
  ReadingShell,
  DetailNotFound,
} from "@/components/content/ReadingShell";
import { ContentShareActions } from "@/components/content/ContentShareActions";
import { GeneratedEditorialCover } from "@/components/content/GeneratedEditorialCover";
import { Action } from "@/components/ds";
import MarkdownView from "@/components/content/MarkdownView";
import { formatDate } from "@/lib/format";
import type { Note } from "@/types/content";

const NoteView: React.FC<{
  note: Note | null | undefined;
  canEdit?: boolean;
}> = ({ note, canEdit = false }) => {
  if (!note) {
    return (
      <DetailNotFound
        title="This note isn't here."
        hint="It may have been renamed or unpublished."
        action={
          <Action href="/notes" tone="ink">
            Back to all notes
          </Action>
        }
      />
    );
  }

  const slug = note.slug ?? note._id;
  const updatedDate = formatDate(note.publishedAt ?? note.updatedAt, "long");
  const coverDetails = [
    typeof note.readTimeMin === "number"
      ? `${note.readTimeMin} min read`
      : undefined,
    ...note.tags,
  ].filter(Boolean) as string[];

  return (
    <ReadingShell
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Notes", href: "/notes" },
        { label: note.title },
      ]}
      eyebrow={note.tags?.[0] ?? "Note"}
      title={note.title}
      deck={note.excerpt}
      meta={[
        formatDate(note.date, "long"),
        updatedDate ? `Last updated ${updatedDate}` : undefined,
        typeof note.readTimeMin === "number"
          ? `${note.readTimeMin} min read`
          : undefined,
        note.author ? `By ${note.author}` : undefined,
      ]}
      tags={note.tags}
      cover={note.media?.imageUrl || note.media?.thumbnailUrl}
      coverAlt={`Cover image for ${note.title}`}
      generatedCover={
        <GeneratedEditorialCover
          kind="note"
          title={note.title}
          eyebrow={note.tags?.[0] ?? "Note"}
          date={formatDate(note.date, "monthYear")}
          details={coverDetails}
        />
      }
      aside={
        <div className="flex flex-wrap gap-2.5">
          {canEdit ? (
            <Action
              href={`/admin/notes/${note._id}`}
              tone="brand"
              size="sm"
            >
              <PencilLine />
              Edit note
            </Action>
          ) : null}
          <ContentShareActions
            kind="note"
            slug={slug}
            title={note.title}
            text={note.excerpt}
          />
        </div>
      }
      footer={
        note.links?.canonical || note.links?.discussion ? (
          <p className="t-meta flex flex-wrap gap-5">
            {note.links?.canonical ? (
              <a
                href={note.links.canonical}
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                Originally published here
              </a>
            ) : null}
            {note.links?.discussion ? (
              <a
                href={note.links.discussion}
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                Join the discussion
              </a>
            ) : null}
          </p>
        ) : null
      }
    >
      <MarkdownView content={note.content} />
    </ReadingShell>
  );
};

export default NoteView;
