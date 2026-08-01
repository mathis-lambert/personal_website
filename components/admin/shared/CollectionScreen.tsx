"use client";

import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { FieldSections, type FieldSpec } from "@/components/admin/shared/fields";
import {
  Empty,
  ErrorNote,
  LoadingRows,
  PageHeader,
} from "@/components/admin/shared/primitives";
import { readForm } from "@/lib/forms";
import { useAdminAuth } from "@/components/admin/providers/AdminAuthProvider";
import { useAdminData } from "@/hooks/admin/useAdminData";
import { getCollectionData } from "@/api/admin";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminCollectionName } from "@/types/admin";
import { cn } from "@/lib/utils";

type Column<T> = {
  header: string;
  cell: (item: T) => ReactNode;
  /** Narrow, right-aligned, mono: for dates, counts and states. */
  meta?: boolean;
};

export type CollectionConfig<T> = {
  collection: AdminCollectionName;
  /** "Project", used in buttons, headings and confirmations. */
  noun: string;
  nounPlural: string;
  description: string;
  columns: Column<T>[];
  fields: FieldSpec[];
  /** Turn a submitted form into the payload the API expects. */
  toPayload: (fields: ReturnType<typeof readForm>) => Record<string, unknown>;
  /** Turn a record into the values the editor shows. */
  toValues: (item: T) => Record<string, unknown>;
  /** Free-text search across a record. */
  searchable: (item: T) => string;
  /** Newest first, usually. */
  sort?: (a: T, b: T) => number;
  /**
   * Mutations receive the whole current list. Timeline records have no id of
   * their own, only a position, so saving one means writing the list back.
   */
  create: (
    payload: Record<string, unknown>,
    token: string,
    current: T[],
  ) => Promise<{ item: T }>;
  update: (
    id: string,
    payload: Record<string, unknown>,
    token: string,
    current: T[],
  ) => Promise<{ item: T }>;
  remove: (id: string, token: string, current: T[]) => Promise<unknown>;
  reorder?: (
    id: string,
    direction: -1 | 1,
    token: string,
    current: T[],
  ) => Promise<T[]>;
  visibility?: {
    isHidden: (item: T) => boolean;
    setHidden: (
      id: string,
      hidden: boolean,
      token: string,
      current: T[],
    ) => Promise<T[]>;
  };
  /** How a record identifies itself in a list and a delete confirmation. */
  identify: (item: T, index: number) => { id: string; label: string };
};

/**
 * One screen for every collection.
 *
 * Projects, notes, experience and studies were four files of near-identical
 * CRUD, around 1700 lines between them, each with its own table markup, its own
 * hand-rolled side panel and its own confirm dialog. They also behaved
 * differently for no reason: two had search, two did not; one confirmed deletes
 * in a modal, another used `window.confirm`.
 *
 * The differences that are real, which fields exist and how a row reads, are
 * data. Everything else is here, once.
 */
export function CollectionScreen<T>({ config }: { config: CollectionConfig<T> }) {
  const { token } = useAdminAuth();

  const load = useMemo(
    () =>
      token
        ? (signal: AbortSignal) =>
            getCollectionData<T[]>(config.collection, { token, signal })
        : null,
    [token, config.collection],
  );
  const { data, error, loading, set } = useAdminData(load);
  const items = useMemo(() => data ?? [], [data]);

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ item: T | null; id?: string } | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<{
    item: T;
    id: string;
    label: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingRow, setUpdatingRow] = useState<string | null>(null);

  /** Identity is resolved against the loaded order before any sorting. */
  const rows = useMemo(
    () => items.map((item, index) => ({ item, ...config.identify(item, index) })),
    [items, config],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((row) =>
          config.searchable(row.item).toLowerCase().includes(needle),
        )
      : rows;
    return config.sort
      ? [...filtered].sort((a, b) => config.sort!(a.item, b.item))
      : filtered;
  }, [rows, query, config]);

  const submit = async (form: HTMLFormElement) => {
    if (!token || !editing) return;
    const payload = config.toPayload(readForm(form));
    const targetId = editing.id;

    setSaving(true);
    try {
      if (editing.item && targetId != null) {
        const { item } = await config.update(targetId, payload, token, items);
        set(
          items.map((row, index) =>
            config.identify(row, index).id === targetId ? item : row,
          ),
        );
        toast.success(`${config.noun} saved`);
      } else {
        const { item } = await config.create(payload, token, items);
        set([...items, item]);
        toast.success(`${config.noun} created`);
      }
      setEditing(null);
    } catch (submitError) {
      toast.error((submitError as Error)?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || !pendingDelete) return;
    const { id, label } = pendingDelete;

    setDeleting(true);
    try {
      await config.remove(id, token, items);
      set(items.filter((row, index) => config.identify(row, index).id !== id));
      toast.success(`Deleted ${label}`);
      setPendingDelete(null);
    } catch (deleteError) {
      toast.error((deleteError as Error)?.message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const reorder = async (id: string, direction: -1 | 1) => {
    if (!token || !config.reorder) return;
    setUpdatingRow(id);
    try {
      set(await config.reorder(id, direction, token, items));
      toast.success("Order saved");
    } catch (reorderError) {
      toast.error((reorderError as Error)?.message ?? "Reorder failed");
    } finally {
      setUpdatingRow(null);
    }
  };

  const setHidden = async (id: string, hidden: boolean) => {
    if (!token || !config.visibility) return;
    setUpdatingRow(id);
    try {
      set(await config.visibility.setHidden(id, hidden, token, items));
      toast.success(hidden ? `${config.noun} hidden` : `${config.noun} visible`);
    } catch (visibilityError) {
      toast.error(
        (visibilityError as Error)?.message ?? "Visibility update failed",
      );
    } finally {
      setUpdatingRow(null);
    }
  };

  return (
    <>
      <PageHeader
        title={config.nounPlural}
        description={config.description}
        count={items.length}
        actions={
          <Button size="sm" onClick={() => setEditing({ item: null })}>
            <Plus /> New {config.noun.toLowerCase()}
          </Button>
        }
      />

      {error ? <ErrorNote message={error} /> : null}

      {items.length > 6 ? (
        <div className="mb-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${config.nounPlural.toLowerCase()}`}
            aria-label={`Search ${config.nounPlural.toLowerCase()}`}
            className="max-w-xs"
          />
        </div>
      ) : null}

      {loading && !data ? (
        <LoadingRows rows={5} />
      ) : items.length === 0 ? (
        <Empty
          title={`No ${config.nounPlural.toLowerCase()} yet.`}
          hint={config.description}
          action={
            <Button size="sm" onClick={() => setEditing({ item: null })}>
              <Plus /> New {config.noun.toLowerCase()}
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <Empty
          title="Nothing matches that search."
          hint="Try a shorter term."
        />
      ) : (
        <div className="overflow-x-auto rounded-3 border border-line">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {config.columns.map((column) => (
                  <TableHead
                    key={column.header}
                    className={cn(
                      "t-eyebrow text-ink-faint",
                      column.meta && "text-right",
                    )}
                  >
                    {column.header}
                  </TableHead>
                ))}
                {config.visibility ? (
                  <TableHead className="t-eyebrow w-24 text-center text-ink-faint">
                    Visible
                  </TableHead>
                ) : null}
                <TableHead className="w-32 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map(({ item, id, label }) => {
                return (
                  <TableRow key={id}>
                    {config.columns.map((column) => (
                      <TableCell
                        key={column.header}
                        className={cn(
                          "align-middle",
                          column.meta && "t-meta text-right text-ink-muted",
                        )}
                      >
                        {column.cell(item)}
                      </TableCell>
                    ))}
                    {config.visibility ? (
                      <TableCell className="text-center">
                        <Switch
                          checked={!config.visibility.isHidden(item)}
                          disabled={updatingRow !== null}
                          aria-label={`Show ${label} on the public site`}
                          onCheckedChange={(checked) =>
                            void setHidden(id, !checked)
                          }
                        />
                      </TableCell>
                    ) : null}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        {config.reorder ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Move ${label} up`}
                              disabled={updatingRow !== null || Number(id) === 0}
                              onClick={() => void reorder(id, -1)}
                            >
                              <ChevronUp />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Move ${label} down`}
                              disabled={
                                updatingRow !== null ||
                                Number(id) === items.length - 1
                              }
                              onClick={() => void reorder(id, 1)}
                            >
                              <ChevronDown />
                            </Button>
                          </>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${label}`}
                          onClick={() => setEditing({ item, id })}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${label}`}
                          onClick={() => setPendingDelete({ item, id, label })}
                          className="text-ink-muted hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
        >
          <SheetHeader className="border-b border-line">
            <SheetTitle>
              {editing?.item
                ? `Edit ${config.noun.toLowerCase()}`
                : `New ${config.noun.toLowerCase()}`}
            </SheetTitle>
            <SheetDescription>
              {editing?.item ? "Changes save when you press Save." : config.description}
            </SheetDescription>
          </SheetHeader>

          {editing ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submit(event.currentTarget);
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
                <FieldSections
                  fields={config.fields}
                  values={editing.item ? config.toValues(editing.item) : null}
                />
              </div>

              {/* Pinned, so Save is reachable without scrolling a long form. */}
              <SheetFooter className="flex-row justify-end gap-2 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : editing.item
                      ? "Save changes"
                      : `Create ${config.noun.toLowerCase()}`}
                </Button>
              </SheetFooter>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {pendingDelete?.label ?? ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from the site immediately. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
              variant="destructive"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
