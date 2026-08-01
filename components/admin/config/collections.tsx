"use client";

import type { CollectionConfig } from "@/components/admin/shared/CollectionScreen";
import { replaceCollection } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import type { TimelineEntry } from "@/types/content";

const timelineConfig = (
  kind: "experiences" | "studies",
  noun: string,
  nounPlural: string,
  description: string,
  subjectLabel: string,
): CollectionConfig<TimelineEntry> => ({
  collection: kind,
  noun,
  nounPlural,
  description,
  searchable: (entry) => `${entry.title} ${entry.company} ${entry.description}`,
  identify: (entry, index) => ({ id: String(index), label: entry.title }),
  columns: [
    {
      header: noun,
      cell: (entry) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{entry.title}</p>
          <p className="truncate text-[0.8rem] text-brand">{entry.company}</p>
        </div>
      ),
    },
    {
      header: "Summary",
      cell: (entry) => (
        <p className="line-clamp-2 max-w-lg text-[0.8rem] text-ink-muted">
          {entry.description}
        </p>
      ),
    },
    {
      header: "Visibility",
      cell: (entry) => (
        <Badge variant="outline" className="t-meta">
          {entry.hide ? "Hidden" : "Visible"}
        </Badge>
      ),
    },
    { header: "Period", meta: true, cell: (entry) => entry.date },
  ],
  fields: [
    {
      name: "title",
      label: noun === "Study" ? "Programme" : "Role",
      type: "text",
      required: true,
    },
    {
      name: "company",
      label: subjectLabel,
      type: "text",
      required: true,
    },
    {
      name: "date",
      label: "Period",
      type: "text",
      required: true,
      hint: "Free text, as it should read on the page: “Sept. 2024 – Present”.",
    },
    {
      name: "description",
      label: "Summary",
      type: "textarea",
      hint: "What you were responsible for. Two or three sentences beats one long one.",
    },
    {
      name: "hide",
      label: "Hide from the public site",
      type: "switch",
      hint: "Keeps this entry in the admin without showing it to visitors.",
    },
  ],
  toValues: (entry) => ({ ...entry }),
  toPayload: (fields) => ({
    title: fields.text("title"),
    company: fields.text("company"),
    date: fields.text("date"),
    description: fields.text("description"),
    hide: fields.flag("hide"),
  }),
  create: async (payload, token, current) => {
    const item = payload as unknown as TimelineEntry;
    await replaceCollection(kind, [...current, item], token);
    return { item };
  },
  update: async (id, payload, token, current) => {
    const item = payload as unknown as TimelineEntry;
    await replaceCollection(
      kind,
      current.map((row, index) => (index === Number(id) ? item : row)),
      token,
    );
    return { item };
  },
  remove: async (id, token, current) =>
    replaceCollection(
      kind,
      current.filter((_, index) => index !== Number(id)),
      token,
    ),
  reorder: async (id, direction, token, current) => {
    const from = Number(id);
    const to = from + direction;
    if (!Number.isInteger(from) || to < 0 || to >= current.length) {
      return current;
    }
    const reordered = [...current];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    await replaceCollection(kind, reordered, token);
    return reordered;
  },
  visibility: {
    isHidden: (entry) => Boolean(entry.hide),
    setHidden: async (id, hidden, token, current) => {
      const index = Number(id);
      const updated = current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, hide: hidden } : entry,
      );
      await replaceCollection(kind, updated, token);
      return updated;
    },
  },
});

/**
 * Timeline records are written back as a whole list, not patched per row: they
 * have no id of their own, only a position.
 */
export const experiencesConfig = timelineConfig(
  "experiences",
  "Role",
  "Experience",
  "Roles listed on the home page and the CV.",
  "Employer",
);

export const studiesConfig = timelineConfig(
  "studies",
  "Study",
  "Studies",
  "Programmes listed on the home page and the CV.",
  "Institution",
);
