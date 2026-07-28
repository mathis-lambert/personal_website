"use client";

import { Check, Link as LinkIcon, Linkedin, Share2 } from "lucide-react";
import type React from "react";
import { useState } from "react";

import {
  ReadingShell,
  DetailNotFound,
} from "@/components/content/ReadingShell";
import { Action } from "@/components/ds";
import MarkdownView from "@/components/ui/MarkdownView";
import { trackUiEvent } from "@/api/analytics";
import { formatDate } from "@/lib/format";
import type { Note } from "@/types";

const NoteView: React.FC<{ note: Note | null | undefined }> = ({ note }) => {
  const [copied, setCopied] = useState(false);

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

  const track = (channel: string) =>
    void trackUiEvent({ name: "note_share", properties: { slug, channel } });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      track("copy_link");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: note.excerpt || note.title,
          url,
        });
        track("native");
        return;
      } catch {
        /* dismissed — fall through to copying */
      }
    }
    await copyLink();
  };

  const shareOnLinkedIn = () => {
    track("linkedin");
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
      "share",
      "width=580,height=420",
    );
  };


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
        typeof note.readTimeMin === "number"
          ? `${note.readTimeMin} min read`
          : undefined,
        note.author ? `By ${note.author}` : undefined,
      ]}
      tags={note.tags}
      cover={note.media?.imageUrl || note.media?.thumbnailUrl}
      coverAlt={`Cover image for ${note.title}`}
      aside={
        // One share row, three real actions. The old header carried five
        // buttons — like, share, Twitter, LinkedIn, copy — each with its own
        // colour, and the like count only ever lived in local state.
        <div className="flex flex-wrap gap-2.5">
          <Action size="sm" onClick={share}>
            <Share2 /> Share
          </Action>
          <Action size="sm" onClick={shareOnLinkedIn}>
            <Linkedin /> LinkedIn
          </Action>
          <Action size="sm" onClick={copyLink}>
            {copied ? <Check /> : <LinkIcon />}
            {copied ? "Copied" : "Copy link"}
          </Action>
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
