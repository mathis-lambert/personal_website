"use client";

import {
  BookOpen,
  CalendarRange,
  ExternalLink,
  Github,
  MessageSquare,
  Trash2,
} from "lucide-react";

import type { EditorialDraft } from "@/lib/editorial/draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FramedInput({
  label,
  icon,
  type = "text",
  value,
  placeholder,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  type?: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center rounded-md border border-input bg-transparent px-3 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <span className="shrink-0 text-ink-faint [&_svg]:size-3.5">{icon}</span>
        <Input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="border-0 bg-transparent pl-2 shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="px-2"
      />
    </div>
  );
}

export function EditorialAdvancedSettings({
  draft,
  onPatch,
  onDelete,
}: {
  draft: EditorialDraft;
  onPatch: (patch: Partial<EditorialDraft>) => void;
  onDelete?: () => void;
}) {
  const isProject = draft.kind === "projects";

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Public path</Label>
        <div className="flex items-center rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <span className="shrink-0 border-r border-line px-2.5 text-xs text-ink-faint">
            /{isProject ? "projects" : "notes"}/
          </span>
          <Input
            value={draft.slug}
            placeholder={isProject ? "project-slug" : "note-slug"}
            onChange={(event) => onPatch({ slug: event.target.value })}
            className="min-w-0 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      {isProject ? (
        <>
          <FramedInput
            label="Live site"
            icon={<ExternalLink />}
            type="url"
            value={draft.liveUrl}
            placeholder="https://…"
            onChange={(liveUrl) => onPatch({ liveUrl })}
          />
          <FramedInput
            label="Repository"
            icon={<Github />}
            type="url"
            value={draft.repoUrl}
            placeholder="https://github.com/…"
            onChange={(repoUrl) => onPatch({ repoUrl })}
          />
          <FramedInput
            label="Documentation"
            icon={<BookOpen />}
            type="url"
            value={draft.docsUrl}
            placeholder="https://…"
            onChange={(docsUrl) => onPatch({ docsUrl })}
          />

          <div className="border-t border-line pt-4">
            <div className="mb-2 flex items-center gap-2">
              <CalendarRange className="size-3.5 text-brand" />
              <Label>Timeline</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <DateField
                label="Started"
                value={draft.startDate}
                onChange={(startDate) => onPatch({ startDate })}
              />
              <DateField
                label="Finished"
                value={draft.endDate}
                onChange={(endDate) => onPatch({ endDate })}
              />
            </div>
          </div>
        </>
      ) : (
        <FramedInput
          label="Discussion"
          icon={<MessageSquare />}
          type="url"
          value={draft.discussionUrl}
          placeholder="https://…"
          onChange={(discussionUrl) => onPatch({ discussionUrl })}
        />
      )}

      {draft._id && onDelete ? (
        <div className="border-t border-line pt-4">
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 /> Delete permanently
          </Button>
        </div>
      ) : null}
    </div>
  );
}
