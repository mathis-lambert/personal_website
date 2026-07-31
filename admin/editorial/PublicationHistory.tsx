"use client";

import { Clock3, History, Loader2, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { listEditorialPublications } from "@/api/editorial";
import type { EditorialKind } from "@/admin/editorial/model";
import { useAdminData } from "@/admin/useAdminData";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export function PublicationHistory({
  kind,
  itemId,
  currentVersion,
  onRollback,
}: {
  kind: EditorialKind;
  itemId: string;
  currentVersion?: number;
  onRollback: (version: number) => Promise<void>;
}) {
  const [rollbackVersion, setRollbackVersion] = useState<number>();
  const [rollingBack, setRollingBack] = useState(false);
  const load = useMemo(
    () => (signal: AbortSignal) =>
      listEditorialPublications(kind, itemId, signal),
    [itemId, kind],
  );
  const { data, error, loading } = useAdminData(load);
  const publications = data ?? [];

  const selected = publications.find(
    (publication) => publication.version === rollbackVersion,
  );

  return (
    <>
      <div className="rounded-3 border border-line bg-paper">
        <div className="flex items-center gap-2 border-b border-line px-3.5 py-3">
          <History className="size-4 text-brand" />
          <p className="text-sm font-bold text-ink">Publication history</p>
          <span className="ml-auto t-meta text-ink-faint">
            {publications.length || "—"}
          </span>
        </div>

        {loading ? (
          <div className="grid place-items-center py-8 text-ink-faint">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : error ? (
          <p className="px-3.5 py-5 text-xs text-destructive">{error}</p>
        ) : publications.length ? (
          <ol className="max-h-72 overflow-y-auto px-2 py-2">
            {publications.map((publication) => {
              const isCurrent = publication.version === currentVersion;
              return (
                <li
                  key={publication._id}
                  className="group flex gap-3 rounded-2 px-2 py-2.5 hover:bg-paper-sink"
                >
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-line-strong group-first:bg-brand" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="t-meta font-bold text-ink">
                        v{publication.version}
                      </span>
                      {isCurrent ? <Badge>Live</Badge> : null}
                      {publication.restoredFromVersion ? (
                        <span className="t-meta text-ink-faint">
                          from v{publication.restoredFromVersion}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs font-bold text-ink-muted">
                      {publication.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 t-meta text-ink-faint">
                      <Clock3 className="size-3" />
                      {formatDate(publication.publishedAt, "short")}
                    </p>
                  </div>
                  {!isCurrent ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setRollbackVersion(publication.version)}
                      aria-label={`Roll back to version ${publication.version}`}
                      title={`Roll back to version ${publication.version}`}
                    >
                      <RotateCcw />
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="px-3.5 py-5 text-xs leading-relaxed text-ink-muted">
            The first publication will start this immutable history.
          </p>
        )}
      </div>

      <AlertDialog
        open={rollbackVersion !== undefined}
        onOpenChange={(open) => !open && setRollbackVersion(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Roll back to version {selected?.version}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This replaces the working draft and publishes it as a new version.
              Existing publications remain untouched in the history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rollingBack}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={rollingBack || !selected}
              onClick={(event) => {
                event.preventDefault();
                if (!selected) return;
                setRollingBack(true);
                void onRollback(selected.version)
                  .then(() => setRollbackVersion(undefined))
                  .catch(() => undefined)
                  .finally(() => setRollingBack(false));
              }}
            >
              {rollingBack ? <Loader2 className="animate-spin" /> : <RotateCcw />}
              Publish rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
