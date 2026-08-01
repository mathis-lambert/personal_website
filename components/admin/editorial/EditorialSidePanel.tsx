"use client";

import { BarChart3, History, Settings2 } from "lucide-react";

import { EditorialAnalytics } from "@/components/admin/editorial/EditorialAnalytics";
import { EditorialSettings } from "@/components/admin/editorial/EditorialSettings";
import type { EditorialDraft } from "@/lib/editorial/draft";
import { PublicationHistory } from "@/components/admin/editorial/PublicationHistory";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export function EditorialSidePanel({
  draft,
  onPatch,
  onArchive,
  onDiscardChanges,
  onRollback,
  onDelete,
}: {
  draft: EditorialDraft;
  onPatch: (patch: Partial<EditorialDraft>) => void;
  onArchive: () => void;
  onDiscardChanges: () => Promise<void>;
  onRollback: (version: number) => Promise<void>;
  onDelete: () => void;
}) {
  return (
    <Tabs
      defaultValue="settings"
      className="min-h-0 w-full flex-1 flex-col gap-0"
    >
      <div className="shrink-0 border-b border-line px-4 py-3">
        <TabsList className="grid h-11 w-full grid-cols-3 rounded-full bg-paper-sink p-1">
          <TabsTrigger value="settings" className="gap-2 rounded-full px-3">
            <Settings2 /> Settings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 rounded-full px-3">
            <BarChart3 /> Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 rounded-full px-3">
            <History /> History
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="settings" className="min-h-0 w-full overflow-hidden">
        <ScrollArea className="h-full">
          <EditorialSettings
            draft={draft}
            onPatch={onPatch}
            onArchive={onArchive}
            onDiscardChanges={onDiscardChanges}
            onDelete={onDelete}
          />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="analytics" className="min-h-0 w-full overflow-hidden">
        <ScrollArea className="h-full">
          <EditorialAnalytics draft={draft} />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="history" className="min-h-0 w-full overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-5 py-5">
            <p className="t-eyebrow text-ink">Immutable publications</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Every publication is preserved. Restoring one creates a new live
              version without rewriting the timeline.
            </p>

            <div className="mt-5">
              {draft._id ? (
                <PublicationHistory
                  key={draft.publishedVersion ?? 0}
                  kind={draft.kind}
                  itemId={draft._id}
                  currentVersion={
                    draft.editorialStatus === "published"
                      ? draft.publishedVersion
                      : undefined
                  }
                  onRollback={onRollback}
                />
              ) : (
                <div className="rounded-3 border border-dashed border-line px-4 py-8 text-center">
                  <History className="mx-auto size-5 text-ink-faint" />
                  <p className="mt-3 text-sm font-bold text-ink">
                    No publications yet
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    Save and publish this document to begin its history.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
