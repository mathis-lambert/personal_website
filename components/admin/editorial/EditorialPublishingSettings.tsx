"use client";

import { Archive, CircleCheck, Clock3, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";

import type { EditorialDraft } from "@/lib/editorial/draft";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const publishingState = (draft: EditorialDraft) => {
  if (draft.editorialStatus === "archived") {
    return {
      label: "Archived",
      badge: "Hidden",
      icon: Archive,
      tone: "text-ink-faint bg-paper-sink",
    };
  }

  if (draft.editorialStatus !== "published") {
    return {
      label: "Private draft",
      badge: "Private",
      icon: Clock3,
      tone: "text-brand bg-brand/10",
    };
  }

  if (draft.hasUnpublishedChanges) {
    return {
      label: "Changes waiting",
      badge: draft.publishedVersion ? `v${draft.publishedVersion} live` : "Live",
      icon: Clock3,
      tone: "text-coral bg-coral/10",
    };
  }

  return {
    label: "Live",
    badge: draft.publishedVersion ? `v${draft.publishedVersion}` : "Published",
    icon: CircleCheck,
    tone: "text-turquoise bg-turquoise/10",
  };
};

export function EditorialPublishingSettings({
  draft,
  onPatch,
  onArchive,
  onDiscardChanges,
}: {
  draft: EditorialDraft;
  onPatch: (patch: Partial<EditorialDraft>) => void;
  onArchive?: () => void;
  onDiscardChanges?: () => Promise<void>;
}) {
  const [discarding, setDiscarding] = useState(false);
  const state = publishingState(draft);
  const Icon = state.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 rounded-3 border border-line bg-paper px-3 py-2.5">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", state.tone)}>
          <Icon className="size-3.5" />
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
          {state.label}
        </p>
        <Badge variant="outline" className="rounded-full text-[0.6875rem]">
          {state.badge}
        </Badge>
      </div>

      {draft.hasUnpublishedChanges && onDiscardChanges ? (
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="outline" className="w-full" />}
          >
            <RotateCcw /> Discard unpublished changes
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard all unpublished changes?</AlertDialogTitle>
              <AlertDialogDescription>
                The working draft will be reset to version {draft.publishedVersion}.
                Every change made since that publication will be permanently lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={discarding}>Keep changes</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={discarding}
                onClick={(event) => {
                  event.preventDefault();
                  setDiscarding(true);
                  void onDiscardChanges()
                    .catch(() => undefined)
                    .finally(() => setDiscarding(false));
                }}
              >
                {discarding ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                Discard changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      <div className="space-y-1.5">
        <Label>Displayed date</Label>
        <Input
          type="date"
          value={draft.date}
          onChange={(event) => onPatch({ date: event.target.value })}
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2 border border-line bg-paper px-3 py-2.5">
        <Label htmlFor="editorial-featured">
          Homepage feature
        </Label>
        <Switch
          id="editorial-featured"
          checked={draft.isFeatured}
          onCheckedChange={(isFeatured) => onPatch({ isFeatured })}
        />
      </div>

      {draft.editorialStatus === "published" && onArchive ? (
        <Button variant="outline" className="w-full" onClick={onArchive}>
          <Archive /> Remove from public site
        </Button>
      ) : null}
    </div>
  );
}
