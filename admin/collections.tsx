"use client";

import type { CollectionConfig } from "@/admin/components/CollectionScreen";
import {
  createItem,
  deleteItem,
  replaceCollection,
  updateItem,
} from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import {
  PROJECT_STATUS_FILTER_OPTIONS,
  resolveProjectStatus,
} from "@/lib/content/projectStatus";
import { byNewest } from "@/lib/content/sort";
import { formatDate } from "@/lib/format";
import type { Note, Project, TimelineEntry } from "@/types";

/**
 * What makes each collection different, and nothing else.
 *
 * The screen itself lives in `CollectionScreen`. These are the parts that vary:
 * which fields exist, how a row reads, and which endpoint saves it.
 */

export const projectsConfig: CollectionConfig<Project> = {
  collection: "projects",
  noun: "Project",
  nounPlural: "Projects",
  description: "Case studies and experiments shown on the work page.",
  sort: byNewest,
  searchable: (project) =>
    [project.title, project.subtitle, project.description, project.client]
      .filter(Boolean)
      .join(" "),
  identify: (project) => ({ id: project._id, label: project.title }),
  columns: [
    {
      header: "Project",
      cell: (project) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{project.title}</p>
          {project.subtitle ? (
            <p className="truncate text-[0.8rem] text-ink-muted">
              {project.subtitle}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      header: "Status",
      cell: (project) => (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="t-meta">
            {resolveProjectStatus(project.status).label}
          </Badge>
          {project.isFeatured ? (
            <Badge className="t-meta border-coral/35 bg-coral/12 text-coral">
              Featured
            </Badge>
          ) : null}
        </div>
      ),
    },
    { header: "Date", meta: true, cell: (project) => formatDate(project.date) },
  ],
  fields: [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      section: "Identity",
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      half: true,
      hint: "Leave blank to generate one from the title.",
      section: "Identity",
    },
    { name: "status", label: "Status", type: "select", half: true, options: PROJECT_STATUS_FILTER_OPTIONS, section: "Identity" },
    { name: "subtitle", label: "Subtitle", type: "text", section: "Identity" },
    {
      name: "description",
      label: "Summary",
      type: "textarea",
      hint: "One or two sentences. Shown on the card and in search results.",
      section: "Identity",
    },
    { name: "date", label: "Date", type: "date", half: true, required: true, section: "Timing" },
    { name: "startDate", label: "Started", type: "date", half: true, section: "Timing" },
    { name: "endDate", label: "Finished", type: "date", half: true, section: "Timing" },
    { name: "isFeatured", label: "Feature on the home page", type: "switch", half: true, section: "Timing" },
    {
      name: "technologies",
      label: "Technologies",
      type: "list",
      hint: "Comma separated.",
      section: "Classification",
    },
    { name: "categories", label: "Categories", type: "list", hint: "Comma separated.", section: "Classification" },
    { name: "role", label: "Role", type: "text", half: true, section: "Classification" },
    { name: "client", label: "Client", type: "text", half: true, section: "Classification" },
    { name: "link_live", label: "Live URL", type: "url", half: true, section: "Links and media" },
    { name: "link_repo", label: "Repository URL", type: "url", half: true, section: "Links and media" },
    { name: "link_docs", label: "Documentation URL", type: "url", half: true, section: "Links and media" },
    { name: "link_video", label: "Demo video URL", type: "url", half: true, section: "Links and media" },
    { name: "media_thumbnailUrl", label: "Card image", type: "url", half: true, section: "Links and media" },
    { name: "media_imageUrl", label: "Header image", type: "url", half: true, section: "Links and media" },
    { name: "media_videoUrl", label: "Embedded video", type: "url", half: true, section: "Links and media" },
    { name: "media_gallery", label: "Gallery", type: "list", hint: "Comma separated image URLs.", section: "Links and media" },
    {
      name: "content",
      label: "Write-up",
      type: "markdown",
      hint: "Markdown. This is the body of the project page.",
      section: "Write-up",
    },
  ],
  toValues: (project) => ({
    ...project,
    date: project.date?.slice(0, 10),
    startDate: project.startDate?.slice(0, 10),
    endDate: project.endDate?.slice(0, 10),
    link_live: project.links?.live,
    link_repo: project.links?.repo,
    link_docs: project.links?.docs,
    link_video: project.links?.video,
    media_thumbnailUrl: project.media?.thumbnailUrl,
    media_imageUrl: project.media?.imageUrl,
    media_videoUrl: project.media?.videoUrl,
    media_gallery: project.media?.gallery,
  }),
  toPayload: (fields) => ({
    title: fields.text("title"),
    slug: fields.optional("slug"),
    subtitle: fields.optional("subtitle"),
    description: fields.optional("description"),
    content: fields.optional("content"),
    date: fields.textOr("date", new Date().toISOString().slice(0, 10)),
    startDate: fields.optional("startDate"),
    endDate: fields.optional("endDate"),
    technologies: fields.list("technologies"),
    categories: fields.list("categories"),
    status: fields.optional("status"),
    isFeatured: fields.flag("isFeatured"),
    role: fields.optional("role"),
    client: fields.optional("client"),
    /**
     * Every subfield, not just the interesting ones. `updateItem` applies these
     * with `$set`, which replaces the whole nested object, so a `links` payload
     * missing `docs` deletes the stored documentation link. Anything the editor
     * does not show, saving destroys.
     */
    links: {
      live: fields.optional("link_live"),
      repo: fields.optional("link_repo"),
      docs: fields.optional("link_docs"),
      video: fields.optional("link_video"),
    },
    media: {
      thumbnailUrl: fields.optional("media_thumbnailUrl"),
      imageUrl: fields.optional("media_imageUrl"),
      videoUrl: fields.optional("media_videoUrl"),
      gallery: fields.list("media_gallery"),
    },
  }),
  create: (payload, token) =>
    createItem("projects", payload as never, token) as Promise<{ item: Project }>,
  update: (id, payload, token) =>
    updateItem("projects", id, payload as never, token) as Promise<{
      item: Project;
    }>,
  remove: (id, token) => deleteItem("projects", id, token),
};

export const notesConfig: CollectionConfig<Note> = {
  collection: "notes",
  noun: "Note",
  nounPlural: "Notes",
  description: "Field notes published on the notes page.",
  sort: byNewest,
  searchable: (note) => [note.title, note.excerpt, ...note.tags].join(" "),
  identify: (note) => ({ id: note._id, label: note.title }),
  columns: [
    {
      header: "Note",
      cell: (note) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{note.title}</p>
          <p className="truncate text-[0.8rem] text-ink-muted">{note.excerpt}</p>
        </div>
      ),
    },
    {
      header: "Tags",
      cell: (note) => (
        <div className="flex flex-wrap items-center gap-1">
          {note.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="t-meta">
              {tag}
            </Badge>
          ))}
          {note.isFeatured ? (
            <Badge className="t-meta border-coral/35 bg-coral/12 text-coral">
              Featured
            </Badge>
          ) : null}
        </div>
      ),
    },
    { header: "Date", meta: true, cell: (note) => formatDate(note.date) },
  ],
  fields: [
    { name: "title", label: "Title", type: "text", required: true, section: "Identity" },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      half: true,
      hint: "Leave blank to generate one from the title.",
      section: "Identity",
    },
    { name: "author", label: "Author", type: "text", half: true, section: "Identity" },
    {
      name: "excerpt",
      label: "Excerpt",
      type: "textarea",
      required: true,
      hint: "The standfirst under the title, and the card summary.",
      section: "Identity",
    },
    { name: "date", label: "Published", type: "date", half: true, required: true, section: "Publishing" },
    { name: "readTimeMin", label: "Read time", type: "number", half: true, hint: "Minutes.", section: "Publishing" },
    { name: "tags", label: "Tags", type: "list", hint: "Comma separated. The first one is shown as the kicker.", section: "Publishing" },
    { name: "categories", label: "Categories", type: "list", hint: "Comma separated.", section: "Publishing" },
    { name: "isFeatured", label: "Feature on the home page", type: "switch", section: "Publishing" },
    { name: "link_canonical", label: "Canonical URL", type: "url", half: true, hint: "If it was published elsewhere first.", section: "Links and media" },
    { name: "link_discussion", label: "Discussion URL", type: "url", half: true, section: "Links and media" },
    { name: "media_thumbnailUrl", label: "Card image", type: "url", half: true, section: "Links and media" },
    { name: "media_imageUrl", label: "Header image", type: "url", half: true, section: "Links and media" },
    { name: "media_gallery", label: "Gallery", type: "list", hint: "Comma separated image URLs.", section: "Links and media" },
    {
      name: "content",
      label: "Body",
      type: "markdown",
      hint: "Markdown. Supports code blocks, Mermaid diagrams and KaTeX.",
      section: "Body",
    },
  ],
  toValues: (note) => ({
    ...note,
    date: note.date?.slice(0, 10),
    link_canonical: note.links?.canonical,
    link_discussion: note.links?.discussion,
    media_thumbnailUrl: note.media?.thumbnailUrl,
    media_imageUrl: note.media?.imageUrl,
    media_gallery: note.media?.gallery,
  }),
  toPayload: (fields) => ({
    title: fields.text("title"),
    slug: fields.optional("slug"),
    excerpt: fields.text("excerpt"),
    content: fields.text("content"),
    author: fields.optional("author"),
    date: fields.textOr("date", new Date().toISOString().slice(0, 10)),
    readTimeMin: Number(fields.text("readTimeMin")) || undefined,
    tags: fields.list("tags"),
    categories: fields.list("categories"),
    isFeatured: fields.flag("isFeatured"),
    links: {
      canonical: fields.optional("link_canonical"),
      discussion: fields.optional("link_discussion"),
    },
    // Same `$set` hazard as projects: list every subfield or lose it.
    media: {
      thumbnailUrl: fields.optional("media_thumbnailUrl"),
      imageUrl: fields.optional("media_imageUrl"),
      gallery: fields.list("media_gallery"),
    },
  }),
  create: (payload, token) =>
    createItem("notes", payload as never, token) as Promise<{ item: Note }>,
  update: (id, payload, token) =>
    updateItem("notes", id, payload as never, token) as Promise<{ item: Note }>,
  remove: (id, token) => deleteItem("notes", id, token),
};

/** Experience and studies are the same record with a different label. */
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
    { header: "Period", meta: true, cell: (entry) => entry.date },
  ],
  fields: [
    { name: "title", label: noun === "Study" ? "Programme" : "Role", type: "text", required: true },
    { name: "company", label: subjectLabel, type: "text", required: true },
    {
      name: "date",
      label: "Period",
      type: "text",
      required: true,
      hint: "Free text, as it should read on the page: “Sept. 2024 – Present”.",
    },
    { name: "description", label: "Summary", type: "textarea", hint: "What you were responsible for. Two or three sentences beats one long one." },
  ],
  toValues: (entry) => ({ ...entry }),
  toPayload: (fields) => ({
    title: fields.text("title"),
    company: fields.text("company"),
    date: fields.text("date"),
    description: fields.text("description"),
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
