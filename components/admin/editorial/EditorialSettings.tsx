"use client";

import Image from "next/image";
import {
  ChevronDown,
  ImagePlus,
  Link2,
  Settings2,
  Tag,
} from "lucide-react";
import { useState } from "react";

import { EditorialAdvancedSettings } from "@/components/admin/editorial/EditorialAdvancedSettings";
import { EditorialClassification } from "@/components/admin/editorial/EditorialClassification";
import { EditorialPublishingSettings } from "@/components/admin/editorial/EditorialPublishingSettings";
import { MediaLibraryDialog } from "@/components/admin/editorial/MediaLibraryDialog";
import type { EditorialDraft } from "@/lib/editorial/draft";
import { GeneratedEditorialCover } from "@/components/content/GeneratedEditorialCover";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { mediaAssetUrl } from "@/types/media";
import { formatDate } from "@/lib/format";

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
      <ChevronDown className="ml-auto size-3.5 transition-transform group-data-panel-open:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="space-y-4 pt-4">{children}</CollapsibleContent>
  </Collapsible>
);

export function EditorialSettings({
  draft,
  onPatch,
  onArchive,
  onDiscardChanges,
  onDelete,
}: {
  draft: EditorialDraft;
  onPatch: (patch: Partial<EditorialDraft>) => void;
  onArchive?: () => void;
  onDiscardChanges?: () => Promise<void>;
  onDelete?: () => void;
}) {
  const [mediaOpen, setMediaOpen] = useState(false);

  return (
    <div className="px-5 pb-8">
      <Section title="Publishing" icon={<Settings2 />} defaultOpen>
        <EditorialPublishingSettings
          draft={draft}
          onPatch={onPatch}
          onArchive={onArchive}
          onDiscardChanges={onDiscardChanges}
        />
      </Section>

      <Section title={draft.kind === "projects" ? "Project details" : "Note details"} icon={<Tag />}>
        <EditorialClassification draft={draft} onPatch={onPatch} />
      </Section>

      <Section title="Cover" icon={<ImagePlus />}>
        {draft.coverUrl ? (
          <div className="relative aspect-video overflow-hidden rounded-3 border border-line">
            <Image src={draft.coverUrl} alt="Current cover" fill sizes="280px" className="object-cover" />
          </div>
        ) : (
          <div className="aspect-video overflow-hidden rounded-3 border border-line">
            <GeneratedEditorialCover
              compact
              kind={draft.kind === "notes" ? "note" : "project"}
              title={draft.title || "Untitled"}
              eyebrow={draft.kind === "notes" ? draft.tags[0] || "Note" : "Project"}
              date={formatDate(draft.date, "monthYear")}
              details={draft.kind === "notes" ? draft.tags : draft.technologies}
            />
          </div>
        )}
        {!draft.coverUrl ? (
          <p className="text-xs leading-relaxed text-ink-faint">
            Generated automatically from the title, date and classification.
          </p>
        ) : null}
        <Button variant="outline" className="w-full" onClick={() => setMediaOpen(true)}>
          <ImagePlus /> {draft.coverUrl ? "Replace cover" : "Use a custom cover"}
        </Button>
        {draft.coverUrl ? <Button variant="ghost" className="w-full" onClick={() => onPatch({ coverUrl: "", thumbnailUrl: "" })}>Remove cover</Button> : null}
      </Section>

      <Section title="Links and advanced" icon={<Link2 />}>
        <EditorialAdvancedSettings
          draft={draft}
          onPatch={onPatch}
          onDelete={onDelete}
        />
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
