"use client";

import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Empty,
  ErrorNote,
  LoadingRows,
  PageHeader,
} from "@/admin/components/primitives";
import { useAdminAuth } from "@/admin/providers/AdminAuthProvider";
import { useAdminData } from "@/admin/useAdminData";
import {
  deleteConversation,
  getConversationDetail,
  getConversations,
  getConversationTurns,
} from "@/api/admin";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDurationMs, formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
] as const;

/**
 * The conversation log.
 *
 * A transcript is a conversation, so it is laid out as one: turns in sequence,
 * the visitor on the left and the assistant answering under it. The previous
 * version put "User Input" and "Assistant Output" in two labelled `<pre>` blocks
 * per turn, which is a debugger's view of a chat and unreadable at any length.
 * Model, duration and errors move to the margin, where they are available
 * without interrupting the reading.
 */
const DiscussionsPage: React.FC = () => {
  const { token } = useAdminAuth();

  const [hours, setHours] = useState<number>(24 * 7);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "errored">("all");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadList = useMemo(() => {
    if (!token) return null;
    const end = new Date();
    const start = new Date(end.getTime() - hours * 3_600_000);
    return (signal: AbortSignal) =>
      getConversations(
        {
          start: start.toISOString(),
          end: end.toISOString(),
          status: status === "all" ? undefined : status,
          q: query || undefined,
          limit: 100,
        },
        { token, signal },
      );
  }, [token, hours, status, query]);

  const {
    data: listData,
    error: listError,
    loading: loadingList,
    reload: reloadList,
  } = useAdminData(loadList);

  const conversations = useMemo(() => listData?.items ?? [], [listData]);

  /** Keep the pick while it is still in the list, otherwise take the first. */
  const selectedId =
    pickedId && conversations.some((item) => item.conversationId === pickedId)
      ? pickedId
      : (conversations[0]?.conversationId ?? null);

  const loadTranscript = useMemo(
    () =>
      token && selectedId
        ? async (signal: AbortSignal) => {
            const options = { token, signal };
            const [detail, turns] = await Promise.all([
              getConversationDetail(selectedId, options),
              getConversationTurns(selectedId, { limit: 250 }, options),
            ]);
            return { detail: detail.item, turns: turns.items };
          }
        : null,
    [token, selectedId],
  );

  const {
    data: transcript,
    error: transcriptError,
    loading: loadingTurns,
  } = useAdminData(loadTranscript);

  const remove = async () => {
    if (!token || !selectedId) return;
    setDeleting(true);
    try {
      await deleteConversation(selectedId, token);
      toast.success("Conversation deleted");
      setPickedId(null);
      setConfirmDelete(false);
      reloadList();
    } catch (error) {
      toast.error((error as Error)?.message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const error = listError ?? transcriptError;
  const selected = transcript?.detail;

  return (
    <>
      <PageHeader
        title="Conversations"
        description="Every exchange visitors had with the site assistant."
        count={listData?.total}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={reloadList}
            disabled={loadingList}
          >
            <RefreshCw className={cn(loadingList && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {error ? <ErrorNote message={error} /> : null}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Date range"
          className="inline-flex rounded-full border border-line p-1"
        >
          {RANGES.map((range) => (
            <button
              key={range.label}
              type="button"
              onClick={() => setHours(range.hours)}
              aria-pressed={hours === range.hours}
              className={cn(
                "rounded-full px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-wider transition-colors",
                hours === range.hours
                  ? "bg-ink text-ink-invert"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search what was said"
          aria-label="Search conversations"
          className="max-w-xs"
        />

        <Select
          value={status}
          onValueChange={(value) =>
            setStatus(value as "all" | "active" | "errored")
          }
        >
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All conversations</SelectItem>
            <SelectItem value="active">Completed</SelectItem>
            <SelectItem value="errored">Errored</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid min-h-0 gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="min-w-0 rounded-3 border border-line">
          <div className="max-h-[34rem] overflow-y-auto">
            {loadingList && !listData ? (
              <div className="p-4">
                <LoadingRows rows={5} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4">
                <Empty
                  title="No conversations here."
                  hint="Widen the range, or clear the search."
                />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {conversations.map((item) => {
                  const active = item.conversationId === selectedId;
                  return (
                    <li key={item.conversationId}>
                      <button
                        type="button"
                        onClick={() => setPickedId(item.conversationId)}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "w-full px-4 py-3 text-left transition-colors",
                          active
                            ? "bg-brand-wash"
                            : "hover:bg-paper-sink",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="t-meta text-ink-faint">
                            {item.turnCount} turn
                            {item.turnCount === 1 ? "" : "s"}
                          </span>
                          <span className="t-meta text-ink-faint">
                            {formatTimestamp(item.lastMessageAt).slice(0, 16)}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-ink">
                          {item.lastUserMessage || "No question recorded"}
                        </p>
                        {item.failedTurns > 0 ? (
                          <span className="t-meta mt-1.5 inline-flex items-center gap-1 text-destructive">
                            <AlertTriangle className="size-3" />
                            {item.failedTurns} failed
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="min-w-0">
          {!selectedId ? (
            <Empty
              title="Nothing selected."
              hint="Pick a conversation on the left to read the whole thread."
            />
          ) : (
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "t-meta",
                      selected?.status === "errored" &&
                        "border-destructive/40 text-destructive",
                    )}
                  >
                    {selected?.status ?? "loading"}
                  </Badge>
                  {selected?.location ? (
                    <span className="t-meta text-ink-faint">
                      from {selected.location}
                    </span>
                  ) : null}
                  {selected?.startedAt ? (
                    <span className="t-meta text-ink-faint">
                      {formatTimestamp(selected.startedAt)}
                    </span>
                  ) : null}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="text-ink-muted hover:text-destructive"
                >
                  <Trash2 /> Delete
                </Button>
              </div>

              {selected?.lastError ? (
                <ErrorNote message={selected.lastError} />
              ) : null}

              {loadingTurns && !transcript ? (
                <LoadingRows rows={4} />
              ) : transcript?.turns.length ? (
                <ol className="flex flex-col gap-6">
                  {transcript.turns.map((turn) => (
                    <li key={turn.turnId} className="flex flex-col gap-2.5">
                      <p className="ml-auto max-w-[85%] rounded-4 rounded-br-1 bg-ink px-4 py-2.5 text-sm leading-relaxed text-ink-invert">
                        {turn.lastUserMessage || "(empty)"}
                      </p>

                      <div className="max-w-[92%]">
                        <p className="whitespace-pre-wrap rounded-4 rounded-bl-1 border border-line bg-paper-lift px-4 py-2.5 text-sm leading-relaxed text-ink">
                          {turn.assistantMessage || "(no answer)"}
                        </p>
                        <p className="t-meta mt-1.5 px-1 text-ink-faint">
                          {turn.model || "unknown model"}
                          {typeof turn.durationMs === "number"
                            ? ` · ${formatDurationMs(turn.durationMs)}`
                            : ""}
                          {turn.errorMessage ? (
                            <span className="text-destructive">
                              {" "}
                              · {turn.errorMessage}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <Empty title="No turns recorded for this conversation." />
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              The whole thread and every turn in it are removed. There is no
              undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void remove();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DiscussionsPage;
