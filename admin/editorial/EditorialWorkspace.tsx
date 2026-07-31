"use client";

import {
  ArrowLeft,
  Check,
  Eye,
  FilePenLine,
  Loader2,
  PanelRight,
  Save,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  deleteEditorialItem,
  getEditorialItem,
  saveEditorialItem,
  updateEditorialPublication,
} from "@/api/editorial";
import { EditorialSettings } from "@/admin/editorial/EditorialSettings";
import {
  createEditorialDraft,
  draftFromItem,
  estimateReadTime,
  extractHeadings,
  previewFromDraft,
  type EditorialDraft,
  type EditorialKind,
} from "@/admin/editorial/model";
import { RichMarkdownEditor } from "@/admin/editorial/RichMarkdownEditor";
import NoteView from "@/components/notes/NoteView";
import ProjectView from "@/components/projects/ProjectView";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { Note, Project } from "@/types";

type SaveState = "idle" | "saving" | "saved" | "error";

export function EditorialWorkspace({
  kind,
  itemId,
}: {
  kind: EditorialKind;
  itemId?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<EditorialDraft>(() => createEditorialDraft(kind));
  const [loading, setLoading] = useState(!!itemId);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [mode, setMode] = useState<"compose" | "preview">("compose");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const revision = useRef(0);
  const saving = useRef(false);

  useEffect(() => {
    if (!itemId) return;
    const controller = new AbortController();
    let cancelled = false;
    void getEditorialItem(kind, itemId, controller.signal)
      .then((item) => {
        if (!cancelled) setDraft(draftFromItem(kind, item));
      })
      .catch((error) => {
        if (!cancelled && !controller.signal.aborted) {
          toast.error((error as Error).message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort(new DOMException("Editor closed", "AbortError"));
    };
  }, [itemId, kind]);

  const patch = useCallback((next: Partial<EditorialDraft>) => {
    revision.current += 1;
    setDraft((current) => ({
      ...current,
      ...next,
      hasUnpublishedChanges:
        current.editorialStatus === "published"
          ? true
          : current.hasUnpublishedChanges,
    }));
    setDirty(true);
  }, []);

  const persist = useCallback(
    async (next: EditorialDraft = draft) => {
      if (!next.title.trim() || saving.current) return null;
      saving.current = true;
      setSaveState("saving");
      const startedRevision = revision.current;
      try {
        const item = await saveEditorialItem(next);
        const created = !next._id;
        setDraft((current) => ({
          ...current,
          _id: item._id,
          slug: current.slug || item.slug || "",
          editorialStatus: item.editorialStatus ?? current.editorialStatus,
          draftRevision: item.draftRevision,
          publishedRevision: item.publishedRevision,
          publishedAt: item.publishedAt,
          hasUnpublishedChanges: !!item.hasUnpublishedChanges,
          updatedAt: item.updatedAt,
        }));
        if (revision.current === startedRevision) setDirty(false);
        setSaveState("saved");
        if (created) {
          router.replace(`/admin/${kind}/${item._id}`);
        }
        return item;
      } catch (error) {
        setSaveState("error");
        toast.error((error as Error).message);
        return null;
      } finally {
        saving.current = false;
      }
    },
    [draft, kind, router],
  );

  useEffect(() => {
    if (!dirty || !draft.title.trim()) return;
    const timer = window.setTimeout(() => void persist(), 1400);
    return () => window.clearTimeout(timer);
  }, [dirty, draft, persist]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void persist();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [persist]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  const headings = useMemo(() => extractHeadings(draft.content), [draft.content]);
  const words = useMemo(
    () => draft.content.trim().split(/\s+/).filter(Boolean).length,
    [draft.content],
  );

  const publish = async () => {
    if (!draft.title.trim() || !draft.summary.trim() || !draft.content.trim()) {
      toast.error("Add a title, introduction and body before publishing.");
      return;
    }
    const saved = await persist(draft);
    if (!saved?._id) return;
    try {
      const item = await updateEditorialPublication(kind, saved._id, "publish");
      setDraft(draftFromItem(kind, item));
      setDirty(false);
      setSaveState("saved");
      toast.success(
        draft.editorialStatus === "published"
          ? "Your new version is live"
          : "Published",
      );
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const archive = async () => {
    if (!draft._id) return;
    try {
      const item = await updateEditorialPublication(kind, draft._id, "archive");
      setDraft(draftFromItem(kind, item));
      toast.success("Removed from the public site");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const remove = async () => {
    if (!draft._id) return;
    try {
      await deleteEditorialItem(kind, draft._id);
      toast.success(`${kind === "notes" ? "Note" : "Project"} deleted`);
      router.push(`/admin/${kind}`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-paper"><Loader2 className="size-6 animate-spin text-brand" /></div>;
  }

  const preview = previewFromDraft(draft);
  const isLive = draft.editorialStatus === "published";
  const canPublish =
    saveState !== "saving" &&
    (!isLive || dirty || draft.hasUnpublishedChanges);

  return (
    <div data-ink={kind === "notes" ? "azure" : "coral"} className="min-h-screen bg-paper-sink/55">
      <header className="sticky top-0 z-40 flex h-[4.5rem] items-center gap-3 border-b border-line bg-paper-lift/92 px-3 backdrop-blur-xl sm:px-5">
        <Button variant="ghost" size="icon" asChild aria-label={`Back to ${kind}`}>
          <Link href={`/admin/${kind}`}><ArrowLeft /></Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold text-ink">{draft.title || `New ${kind === "notes" ? "note" : "project"}`}</p>
          <p className={cn("t-meta flex items-center gap-1.5", saveState === "error" ? "text-destructive" : "text-ink-faint")}>
            {saveState === "saving" ? <Loader2 className="size-3 animate-spin" /> : saveState === "saved" ? <Check className="size-3 text-turquoise" /> : dirty ? <span className="size-1.5 rounded-full bg-coral" /> : null}
            {saveState === "saving" ? "Saving privately…" : saveState === "error" ? "Save failed" : dirty ? "Unsaved changes" : draft._id ? "Work saved" : "Draft not saved yet"}
            {isLive ? <span aria-hidden="true">·</span> : null}
            {isLive ? (
              <span className={draft.hasUnpublishedChanges || dirty ? "text-coral" : "text-turquoise"}>
                {draft.hasUnpublishedChanges || dirty ? "new version not published" : "live version up to date"}
              </span>
            ) : null}
          </p>
        </div>

        <ToggleGroup type="single" value={mode} onValueChange={(value) => value && setMode(value as typeof mode)} variant="outline" size="sm" className="hidden sm:flex">
          <ToggleGroupItem value="compose"><FilePenLine /> Compose</ToggleGroupItem>
          <ToggleGroupItem value="preview"><Eye /> Read</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="outline" size="icon" className="xl:hidden" onClick={() => setSettingsOpen(true)} aria-label="Open settings"><PanelRight /></Button>
        <Button variant="outline" size="sm" onClick={() => void persist()} disabled={!draft.title.trim() || saveState === "saving"} className="hidden sm:inline-flex"><Save /> Save</Button>
        <Button size="sm" onClick={() => void publish()} disabled={!canPublish}><Send /> <span className="hidden sm:inline">{isLive ? (draft.hasUnpublishedChanges || dirty ? "Publish changes" : "Published") : "Publish"}</span></Button>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-[112rem] xl:grid-cols-[15rem_minmax(0,1fr)_19rem]">
        <aside className="hidden border-r border-line bg-paper/65 px-5 py-8 xl:block">
          <p className="t-eyebrow text-ink-faint">The margin</p>
          <nav className="mt-5 space-y-1.5">
            {headings.length ? headings.map((heading, index) => (
              <button
                key={`${heading.title}-${index}`}
                type="button"
                onClick={() => document.querySelectorAll(".editorial-canvas h2, .editorial-canvas h3")[index]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className={cn("block w-full truncate rounded-2 py-1.5 text-left text-xs text-ink-muted hover:text-brand", heading.level === 3 ? "pl-4" : "pl-2 font-bold")}
              >
                {heading.title}
              </button>
            )) : <p className="text-xs leading-relaxed text-ink-faint">Your headings will become the document map.</p>}
          </nav>
          <div className="mt-10 border-t border-line pt-4 t-meta text-ink-faint">
            <p>{words.toLocaleString()} words</p>
            <p>{estimateReadTime(draft.content)} min read</p>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="flex justify-center border-b border-line bg-paper-lift px-3 py-2 sm:hidden">
            <ToggleGroup type="single" value={mode} onValueChange={(value) => value && setMode(value as typeof mode)} variant="outline" size="sm">
              <ToggleGroupItem value="compose"><FilePenLine /> Compose</ToggleGroupItem>
              <ToggleGroupItem value="preview"><Eye /> Read</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {mode === "compose" ? (
            <article className="mx-auto min-h-full max-w-[52rem] bg-paper-lift px-6 pb-28 pt-12 shadow-[0_0_0_1px_var(--line),0_24px_80px_-50px_var(--ink)] sm:px-12 lg:px-20 lg:pt-20">
              <Input
                value={draft.title}
                onChange={(event) => patch({ title: event.target.value })}
                placeholder={kind === "notes" ? "Title your note" : "Name the project"}
                aria-label="Title"
                className="h-auto border-0 bg-transparent px-0 font-display text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[0.95] tracking-[-0.055em] shadow-none placeholder:text-ink-faint/45 focus-visible:ring-0"
              />
              <Textarea
                value={draft.summary}
                onChange={(event) => patch({ summary: event.target.value })}
                placeholder="Write the sentence that makes the rest worth reading…"
                aria-label="Introduction"
                className="mt-7 min-h-20 resize-none border-0 bg-transparent px-0 text-lg leading-relaxed text-ink-muted shadow-none placeholder:text-ink-faint/50 focus-visible:ring-0"
              />
              <div className="my-10 h-px bg-line" />
              <RichMarkdownEditor value={draft.content} onChange={(content) => patch({ content })} />
            </article>
          ) : (
            <div className="animate-in fade-in duration-300 bg-paper-lift">
              {kind === "notes" ? <NoteView note={preview as Note} /> : <ProjectView project={preview as Project} />}
            </div>
          )}
        </main>

        <aside className="hidden border-l border-line bg-paper/70 xl:block">
          <div className="sticky top-[4.5rem] max-h-[calc(100vh-4.5rem)] overflow-y-auto">
            <div className="px-5 pt-6"><p className="t-eyebrow text-ink-faint">Document settings</p></div>
            <EditorialSettings draft={draft} onPatch={patch} onArchive={() => void archive()} onDelete={() => setDeleteOpen(true)} />
          </div>
        </aside>
      </div>

      {settingsOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button aria-label="Close settings" className="absolute inset-0 bg-ink/35" onClick={() => setSettingsOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-[min(24rem,92vw)] overflow-y-auto border-l border-line bg-paper-lift shadow-2 animate-in slide-in-from-right duration-200">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper-lift px-5 py-4">
              <p className="font-display font-bold">Document settings</p>
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X /></Button>
            </div>
            <EditorialSettings draft={draft} onPatch={patch} onArchive={() => void archive()} onDelete={() => setDeleteOpen(true)} />
          </aside>
        </div>
      ) : null}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{draft.title || "Untitled"}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the document. Uploaded media stays in the library for reuse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void remove(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
