import { FileText, FolderKanban } from "lucide-react";
import Link from "next/link";

import type { ContentPerformanceItem } from "@/types/analytics";

export function ContentPerformanceList({
  items,
}: {
  items: ContentPerformanceItem[];
}) {
  const maxViews = Math.max(...items.map((item) => item.views), 1);
  const count = (value: number, singular: string) =>
    `${value} ${value === 1 ? singular : `${singular}s`}`;

  return (
    <ol className="divide-y divide-line">
      {items.slice(0, 8).map((item) => {
        const destination = item.itemId
          ? `/admin/${item.kind === "project" ? "projects" : "notes"}/${item.itemId}`
          : `/${item.kind === "project" ? "projects" : "notes"}/${item.slug}`;
        const Icon = item.kind === "project" ? FolderKanban : FileText;

        return (
          <li key={`${item.kind}-${item.slug}`} className="py-3">
            <div className="flex items-center gap-2.5">
              <Icon className="size-3.5 shrink-0 text-ink-faint" />
              <Link
                href={destination}
                className="min-w-0 flex-1 truncate text-sm font-bold text-ink no-underline hover:text-brand"
              >
                {item.title}
              </Link>
              <span className="t-meta shrink-0 tabular-nums text-ink">
                {item.views}
              </span>
            </div>
            <div className="ml-6 mt-2 flex items-center gap-3">
              <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-paper-sink">
                <span
                  className="block h-full rounded-full bg-brand"
                  style={{ width: `${(item.views / maxViews) * 100}%` }}
                />
              </span>
              <span className="t-meta w-24 shrink-0 text-right text-ink-faint">
                {count(item.visitors, "visitor")} · {count(item.shares, "share")}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
