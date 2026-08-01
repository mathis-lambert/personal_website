"use client";

import { Archive, ArrowRight, FileText, FolderKanban, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { EditorialItem, EditorialKind } from "@/lib/editorial/draft";
import { Empty, ErrorNote, LoadingRows, PageHeader } from "@/components/admin/shared/primitives";
import { useAdminAuth } from "@/components/admin/providers/AdminAuthProvider";
import { useAdminData } from "@/hooks/admin/useAdminData";
import { getCollectionData } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import type { EditorialStatus, Note, Project } from "@/types/content";

const statusOf = (item: EditorialItem): EditorialStatus =>
  item.editorialStatus ?? "published";

const searchableText = (item: EditorialItem) => {
  if ("excerpt" in item) return `${item.title} ${item.excerpt} ${item.tags.join(" ")}`;
  return `${item.title} ${item.subtitle ?? ""} ${item.technologies.join(" ")}`;
};

export function EditorialLibrary({ kind }: { kind: EditorialKind }) {
  const { token } = useAdminAuth();
  const [status, setStatus] = useState<"all" | EditorialStatus>("all");
  const [query, setQuery] = useState("");
  const noun = kind === "notes" ? "Note" : "Project";
  const load = useMemo(
    () => token ? (signal: AbortSignal) => getCollectionData<EditorialItem[]>(kind, { token, signal }) : null,
    [kind, token],
  );
  const { data, error, loading } = useAdminData(load);

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data ?? [])
      .filter((item) => status === "all" || statusOf(item) === status)
      .filter((item) => !needle || searchableText(item).toLowerCase().includes(needle))
      .sort((a, b) => new Date(b.updatedAt ?? b.date).getTime() - new Date(a.updatedAt ?? a.date).getTime());
  }, [data, query, status]);

  return (
    <>
      <PageHeader
        title={kind === "notes" ? "Writing desk" : "Project stories"}
        description={kind === "notes" ? "Draft, shape, and publish field notes." : "Turn shipped work into case studies worth reading."}
        count={data?.length}
        actions={<Link href={`/admin/${kind}/new`} className={buttonVariants({ size: "sm" })}><Plus /> New {noun.toLowerCase()}</Link>}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${kind}`} className="sm:max-w-xs" />
      </div>

      {error ? <ErrorNote message={error} /> : null}
      {loading && !data ? <LoadingRows rows={5} /> : items.length ? (
        <div className="overflow-hidden rounded-4 border border-line bg-paper-lift">
          {items.map((item) => {
            const itemStatus = statusOf(item);
            const summary = "excerpt" in item ? (item as Note).excerpt : (item as Project).subtitle ?? (item as Project).description;
            return (
              <Link
                key={item._id}
                href={`/admin/${kind}/${item._id}`}
                className="group grid gap-3 border-b border-line px-5 py-5 no-underline transition-colors last:border-0 hover:bg-brand-wash/45 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-center"
              >
                <span className="hidden text-ink-faint sm:block">{kind === "notes" ? <FileText className="size-4" /> : <FolderKanban className="size-4" />}</span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-display text-base font-bold text-ink">{item.title || "Untitled"}</span>
                    <Badge variant={itemStatus === "published" ? "default" : "outline"} className="t-meta">
                      {itemStatus === "archived" ? <Archive /> : null}{itemStatus}
                    </Badge>
                  </span>
                  {summary ? <span className="mt-1 block truncate text-sm text-ink-muted">{summary}</span> : null}
                </span>
                <span className="flex items-center justify-between gap-5 sm:justify-end">
                  <span className="t-meta text-ink-faint">{item.updatedAt ? `Edited ${formatDate(item.updatedAt, "short")}` : formatDate(item.date, "short")}</span>
                  <ArrowRight className="size-4 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" />
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty title={query || status !== "all" ? "Nothing matches this view." : `No ${kind} yet.`} hint={query || status !== "all" ? "Try another status or search term." : `Create your first ${noun.toLowerCase()} and start writing.`} action={<Link href={`/admin/${kind}/new`} className={buttonVariants()}><Plus /> New {noun.toLowerCase()}</Link>} />
      )}
    </>
  );
}
