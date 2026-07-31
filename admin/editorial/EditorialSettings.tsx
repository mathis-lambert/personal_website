"use client";

import Image from "next/image";
import { ChevronDown, ImagePlus, Link2, Settings2, Tag, Trash2 } from "lucide-react";
import { useState } from "react";

import { MediaLibraryDialog } from "@/admin/editorial/MediaLibraryDialog";
import type { EditorialDraft } from "@/admin/editorial/model";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { mediaAssetUrl } from "@/types/media";

const Section = ({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => (
  <Collapsible defaultOpen={defaultOpen} className="border-b border-line py-4">
    <CollapsibleTrigger className="group flex w-full items-center gap-2 text-left t-eyebrow text-ink">
      <span className="text-brand [&_svg]:size-3.5">{icon}</span>
      {title}
      <ChevronDown className="ml-auto size-3.5 transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="space-y-4 pt-4">{children}</CollapsibleContent>
  </Collapsible>
);

const TextField = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) => (
  <div className="space-y-1.5">
    <Label className="t-meta text-ink-muted">{label}</Label>
    <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
  </div>
);

const ListField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) => (
  <TextField
    label={label}
    value={value.join(", ")}
    onChange={(next) => onChange(next.split(",").map((item) => item.trim()).filter(Boolean))}
  />
);

export function EditorialSettings({
  draft,
  onPatch,
  onDelete,
}: {
  draft: EditorialDraft;
  onPatch: (patch: Partial<EditorialDraft>) => void;
  onDelete?: () => void;
}) {
  const [mediaOpen, setMediaOpen] = useState(false);

  return (
    <div className="px-5 pb-8">
      <Section title="Publishing" icon={<Settings2 />} defaultOpen>
        <div className="space-y-1.5">
          <Label className="t-meta text-ink-muted">Editorial status</Label>
          <Select value={draft.editorialStatus} onValueChange={(editorialStatus) => onPatch({ editorialStatus: editorialStatus as EditorialDraft["editorialStatus"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              {draft.editorialStatus === "published" ? (
                <SelectItem value="published">Published</SelectItem>
              ) : null}
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TextField label="Publication date" type="date" value={draft.date} onChange={(date) => onPatch({ date })} />
        <div className="flex items-center justify-between gap-3 rounded-2 border border-line px-3 py-2.5">
          <Label htmlFor="editorial-featured" className="text-sm">Feature on home</Label>
          <Switch id="editorial-featured" checked={draft.isFeatured} onCheckedChange={(isFeatured) => onPatch({ isFeatured })} />
        </div>
      </Section>

      <Section title="Classification" icon={<Tag />}>
        {draft.kind === "notes" ? (
          <ListField label="Tags" value={draft.tags} onChange={(tags) => onPatch({ tags })} />
        ) : (
          <ListField label="Technologies" value={draft.technologies} onChange={(technologies) => onPatch({ technologies })} />
        )}
        <ListField label="Categories" value={draft.categories} onChange={(categories) => onPatch({ categories })} />
        {draft.kind === "projects" ? (
          <>
            <div className="space-y-1.5">
              <Label className="t-meta text-ink-muted">Project status</Label>
              <Select value={draft.projectStatus} onValueChange={(projectStatus) => onPatch({ projectStatus: projectStatus as EditorialDraft["projectStatus"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TextField label="Role" value={draft.role} onChange={(role) => onPatch({ role })} />
            <TextField label="Client" value={draft.client} onChange={(client) => onPatch({ client })} />
          </>
        ) : (
          <>
            <TextField label="Author" value={draft.author} onChange={(author) => onPatch({ author })} />
            <TextField label="Canonical URL" type="url" value={draft.canonicalUrl} onChange={(canonicalUrl) => onPatch({ canonicalUrl })} />
          </>
        )}
      </Section>

      <Section title="Cover" icon={<ImagePlus />}>
        {draft.coverUrl ? (
          <div className="relative aspect-video overflow-hidden rounded-3 border border-line">
            <Image src={draft.coverUrl} alt="Current cover" fill sizes="280px" className="object-cover" />
          </div>
        ) : null}
        <Button variant="outline" className="w-full" onClick={() => setMediaOpen(true)}>
          <ImagePlus /> {draft.coverUrl ? "Replace cover" : "Choose cover"}
        </Button>
        {draft.coverUrl ? <Button variant="ghost" className="w-full" onClick={() => onPatch({ coverUrl: "", thumbnailUrl: "" })}>Remove cover</Button> : null}
      </Section>

      <Section title="Links and advanced" icon={<Link2 />}>
        <TextField label="Slug" value={draft.slug} onChange={(slug) => onPatch({ slug })} />
        {draft.kind === "projects" ? (
          <>
            <TextField label="Live URL" type="url" value={draft.liveUrl} onChange={(liveUrl) => onPatch({ liveUrl })} />
            <TextField label="Repository URL" type="url" value={draft.repoUrl} onChange={(repoUrl) => onPatch({ repoUrl })} />
            <TextField label="Documentation URL" type="url" value={draft.docsUrl} onChange={(docsUrl) => onPatch({ docsUrl })} />
            <TextField label="Started" type="date" value={draft.startDate} onChange={(startDate) => onPatch({ startDate })} />
            <TextField label="Finished" type="date" value={draft.endDate} onChange={(endDate) => onPatch({ endDate })} />
          </>
        ) : (
          <TextField label="Discussion URL" type="url" value={draft.discussionUrl} onChange={(discussionUrl) => onPatch({ discussionUrl })} />
        )}
        {draft._id && onDelete ? (
          <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 /> Delete permanently
          </Button>
        ) : null}
      </Section>

      <MediaLibraryDialog
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        onSelect={(asset) => {
          const coverUrl = mediaAssetUrl(asset, 2400) ?? "";
          const thumbnailUrl = mediaAssetUrl(asset, 640) ?? coverUrl;
          onPatch({ coverUrl, thumbnailUrl });
        }}
      />
    </div>
  );
}
