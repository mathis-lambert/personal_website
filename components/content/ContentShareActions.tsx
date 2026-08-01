"use client";

import { Check, Link as LinkIcon, Linkedin, Share2 } from "lucide-react";
import { useState } from "react";

import { trackUiEvent } from "@/api/analytics";
import { Action } from "@/components/ds";
import type { ContentAnalyticsKind } from "@/types/analytics";

export function ContentShareActions({
  kind,
  slug,
  title,
  text,
}: {
  kind: ContentAnalyticsKind;
  slug: string;
  title: string;
  text?: string;
}) {
  const [copied, setCopied] = useState(false);

  const track = (channel: "copy_link" | "native" | "linkedin") =>
    void trackUiEvent({
      name: "content_share",
      properties: { kind, slug, channel },
    });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      track("copy_link");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is optional; sharing must not break the page.
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url: window.location.href,
        });
        track("native");
        return;
      } catch {
        // A dismissed native sheet falls back to the predictable copy action.
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
    <>
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
    </>
  );
}
