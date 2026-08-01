"use client";

import {
  ArrowLeft,
  Check,
  Eye,
  FilePenLine,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRight,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  archiveEditorialItem,
  deleteEditorialItem,
  discardEditorialChanges,
  getEditorialItem,
  publishEditorialItem,
  rollbackEditorialItem,
  saveEditorialItem,
} from "@/api/editorial";
import { EditorialSidePanel } from "@/components/admin/editorial/EditorialSidePanel";
import {
  createEditorialDraft,
  draftFromItem,
  estimateReadTime,
  extractHeadings,
  previewFromDraft,
  type EditorialDraft,
  type EditorialKind,
} from "@/lib/editorial/draft";
import { RichMarkdownEditor } from "@/components/admin/editorial/RichMarkdownEditor";
import NoteView from "@/components/notes/NoteView";
import ProjectView from "@/components/projects/ProjectView";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { Note, Project } from "@/types/content";

type SaveState = "idle" | "saving" | "saved" | "error";

const EditorialModeSwitch = ({
  mode,
  onChange,
}: {
  mode: "compose" | "preview";
  onChange: (mode: "compose" | "preview") => void;
}) => (
  <ToggleGroup
    value={[mode]}
    onValueChange={(value) =>
      value[0] && onChange(value[0] as "compose" | "preview")
    }
    size="sm"
    spacing={1}
    aria-label="Editor mode"
    className="rounded-full border border-line bg-paper-sink/85 p-1 shadow-1"
  >
    <ToggleGroupItem
      value="compose"
      className="rounded-full border-0 px-3 aria-pressed:bg-paper-lift aria-pressed:shadow-1"
    >
      <FilePenLine /> Compose
    </ToggleGroupItem>
    <ToggleGroupItem
      value="preview"
      className="rounded-full border-0 px-3 aria-pressed:bg-paper-lift aria-pressed:shadow-1"
    >
      <Eye /> Read
    </ToggleGroupItem>
  </ToggleGroup>
);

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
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const revision = useRef(0);
  const saving = useRef(false);
  const discarding = useRef(false);

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
      if (!next.title.trim() || saving.current || discarding.current) return null;
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
          publishedDraftRevision: item.publishedDraftRevision,
          publishedVersion: item.publishedVersion,
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
      const { item } = await publishEditorialItem(kind, saved._id);
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
      const item = await archiveEditorialItem(kind, draft._id);
      setDraft(draftFromItem(kind, item));
      toast.success("Removed from the public site");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const discardChanges = async () => {
    if (!draft._id || discarding.current) return;
    if (saving.current) {
      const error = new Error("Wait for the current save to finish, then try again.");
      toast.error(error.message);
      throw error;
    }

    discarding.current = true;
    revision.current += 1;
    setDirty(false);
    try {
      const item = await discardEditorialChanges(kind, draft._id);
      setDraft(draftFromItem(kind, item));
      setSaveState("saved");
      toast.success("Unpublished changes discarded");
    } catch (error) {
      setDirty(true);
      toast.error((error as Error).message);
      throw error;
    } finally {
      discarding.current = false;
    }
  };

  const rollback = async (version: number) => {
    if (!draft._id) return;
    try {
      const { item, publication } = await rollbackEditorialItem(
        kind,
        draft._id,
        version,
      );
      setDraft(draftFromItem(kind, item));
      revision.current += 1;
      setDirty(false);
      setSaveState("saved");
      toast.success(
        `Version ${version} restored as publication ${publication.version}`,
      );
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
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
        <Link
          href={`/admin/${kind}`}
          aria-label={`Back to ${kind}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft />
        </Link>
        <div className="min-w-0 flex-1 xl:max-w-[30vw]">
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

        <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 xl:block">
          <div className="pointer-events-auto">
            <EditorialModeSwitch mode={mode} onChange={setMode} />
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center rounded-full border border-line bg-paper-sink p-0.5 xl:flex">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => setLeftPanelOpen((open) => !open)}
              aria-label={leftPanelOpen ? "Hide document outline" : "Show document outline"}
              aria-pressed={!leftPanelOpen}
              title={leftPanelOpen ? "Hide outline" : "Show outline"}
            >
              {leftPanelOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => setRightPanelOpen((open) => !open)}
              aria-label={rightPanelOpen ? "Hide document settings" : "Show document settings"}
              aria-pressed={!rightPanelOpen}
              title={rightPanelOpen ? "Hide settings" : "Show settings"}
            >
              {rightPanelOpen ? <PanelRightClose /> : <PanelRightOpen />}
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="xl:hidden"
            onClick={() => setMode(mode === "compose" ? "preview" : "compose")}
            aria-label={mode === "compose" ? "Switch to Read" : "Switch to Compose"}
            title={mode === "compose" ? "Read preview" : "Back to editor"}
          >
            {mode === "compose" ? <Eye /> : <FilePenLine />}
          </Button>
          <Button variant="outline" size="icon" className="xl:hidden" onClick={() => setSettingsOpen(true)} aria-label="Open settings"><PanelRight /></Button>
          <Button variant="outline" size="sm" onClick={() => void persist()} disabled={!draft.title.trim() || saveState === "saving"} className="hidden sm:inline-flex"><Save /> Save</Button>
          <Button size="sm" onClick={() => void publish()} disabled={!canPublish}><Send /> <span className="hidden sm:inline">{isLive ? (draft.hasUnpublishedChanges || dirty ? "Publish changes" : "Published") : "Publish"}</span></Button>
        </div>
      </header>

      <div
        className={cn(
          "mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-[116rem]",
          leftPanelOpen && rightPanelOpen && "xl:grid-cols-[15rem_minmax(0,1fr)_22rem]",
          leftPanelOpen && !rightPanelOpen && "xl:grid-cols-[15rem_minmax(0,1fr)]",
          !leftPanelOpen && rightPanelOpen && "xl:grid-cols-[minmax(0,1fr)_22rem]",
          !leftPanelOpen && !rightPanelOpen && "xl:grid-cols-[minmax(0,1fr)]",
        )}
      >
        {leftPanelOpen ? <aside className="hidden border-r border-line bg-paper/65 xl:block">
          <div className="sticky top-[4.5rem] flex h-[calc(100dvh-4.5rem)] flex-col px-5 py-8">
            <p className="shrink-0 t-eyebrow text-ink-faint">The margin</p>
            <ScrollArea className="-mr-3 mt-5 min-h-0 flex-1 pr-3">
              <nav className="space-y-1.5">
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
            </ScrollArea>
            <div className="mt-6 shrink-0 border-t border-line pt-4 t-meta text-ink-faint">
              <p>{words.toLocaleString()} words</p>
              <p>{estimateReadTime(draft.content)} min read</p>
            </div>
          </div>
        </aside> : null}

        <main className="min-w-0">
          {mode === "compose" ? (
            <article className="mx-auto min-h-full max-w-[52rem] bg-paper-lift px-6 pb-28 pt-12 shadow-[0_0_0_1px_var(--line),0_24px_80px_-50px_rgb(0_0_0_/_0.5)] sm:px-12 lg:px-20 lg:pt-20">
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

        {rightPanelOpen ? <aside className="hidden border-l border-line bg-paper/70 xl:block">
          <div className="sticky top-[4.5rem] flex h-[calc(100dvh-4.5rem)] flex-col overflow-hidden">
            <div className="shrink-0 px-5 pt-6 pb-2">
              <p className="t-eyebrow text-ink-faint">Document</p>
            </div>
            <EditorialSidePanel
              draft={draft}
              onPatch={patch}
              onArchive={() => void archive()}
              onDiscardChanges={discardChanges}
              onRollback={rollback}
              onDelete={() => setDeleteOpen(true)}
            />
          </div>
        </aside> : null}
      </div>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[min(24rem,92vw)] gap-0 overflow-hidden border-line bg-paper-lift p-0 shadow-2 sm:max-w-none xl:hidden"
        >
          <div className="z-10 flex shrink-0 items-center justify-between border-b border-line bg-paper-lift px-5 py-4">
            <p className="font-display font-bold">Document</p>
            <SheetClose render={<Button variant="ghost" size="icon" />} aria-label="Close settings">
              <X />
            </SheetClose>
          </div>
          <EditorialSidePanel
            draft={draft}
            onPatch={patch}
            onArchive={() => void archive()}
            onDiscardChanges={discardChanges}
            onRollback={rollback}
            onDelete={() => setDeleteOpen(true)}
          />
        </SheetContent>
      </Sheet>

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
            <AlertDialogAction variant="destructive" onClick={(event) => { event.preventDefault(); void remove(); }}>
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
