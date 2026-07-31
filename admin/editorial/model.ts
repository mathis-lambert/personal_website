import type {
  EditorialStatus,
  Note,
  Project,
  ProjectStatus,
} from "@/types";
import type {
  EditorialCollection,
  EditorialItem as StoredEditorialItem,
} from "@/types/editorial";

export type EditorialKind = EditorialCollection;
export type EditorialItem = StoredEditorialItem;

export type EditorialDraft = {
  kind: EditorialKind;
  _id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  date: string;
  editorialStatus: EditorialStatus;
  isFeatured: boolean;
  tags: string[];
  categories: string[];
  coverUrl: string;
  thumbnailUrl: string;
  gallery: string[];
  author: string;
  readTimeMin?: number;
  canonicalUrl: string;
  discussionUrl: string;
  projectStatus: ProjectStatus;
  startDate: string;
  endDate: string;
  technologies: string[];
  role: string;
  client: string;
  liveUrl: string;
  repoUrl: string;
  docsUrl: string;
  videoUrl: string;
  draftRevision?: number;
  publishedDraftRevision?: number;
  publishedVersion?: number;
  publishedAt?: string;
  hasUnpublishedChanges: boolean;
  updatedAt?: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const projectTemplate = `## Context

What made this project worth building?

## The problem

Describe the constraint or friction you wanted to remove.

## Approach

Explain the decisions, trade-offs, and implementation.

## Results

What changed, and what did you learn?
`;

export const createEditorialDraft = (kind: EditorialKind): EditorialDraft => ({
  kind,
  title: "",
  slug: "",
  summary: "",
  content: kind === "projects" ? projectTemplate : "",
  date: today(),
  editorialStatus: "draft",
  isFeatured: false,
  tags: [],
  categories: [],
  coverUrl: "",
  thumbnailUrl: "",
  gallery: [],
  author: "Mathis Lambert",
  canonicalUrl: "",
  discussionUrl: "",
  projectStatus: "in-progress",
  startDate: "",
  endDate: "",
  technologies: [],
  role: "",
  client: "",
  liveUrl: "",
  repoUrl: "",
  docsUrl: "",
  videoUrl: "",
  hasUnpublishedChanges: false,
});

export const draftFromItem = (
  kind: EditorialKind,
  item: EditorialItem,
): EditorialDraft => {
  const base = createEditorialDraft(kind);
  if (kind === "notes") {
    const note = item as Note;
    return {
      ...base,
      _id: note._id,
      title: note.title,
      slug: note.slug ?? "",
      summary: note.excerpt,
      content: note.content,
      date: note.date.slice(0, 10),
      editorialStatus: note.editorialStatus ?? "published",
      isFeatured: !!note.isFeatured,
      tags: note.tags,
      categories: note.categories ?? [],
      coverUrl: note.media?.imageUrl ?? "",
      thumbnailUrl: note.media?.thumbnailUrl ?? "",
      gallery: note.media?.gallery ?? [],
      author: note.author ?? "Mathis Lambert",
      readTimeMin: note.readTimeMin,
      canonicalUrl: note.links?.canonical ?? "",
      discussionUrl: note.links?.discussion ?? "",
      draftRevision: note.draftRevision,
      publishedDraftRevision: note.publishedDraftRevision,
      publishedVersion: note.publishedVersion,
      publishedAt: note.publishedAt,
      hasUnpublishedChanges: !!note.hasUnpublishedChanges,
      updatedAt: note.updatedAt,
    };
  }

  const project = item as Project;
  return {
    ...base,
    _id: project._id,
    title: project.title,
    slug: project.slug ?? "",
    summary: project.subtitle ?? project.description ?? "",
    content: project.content ?? "",
    date: project.date.slice(0, 10),
    editorialStatus: project.editorialStatus ?? "published",
    isFeatured: !!project.isFeatured,
    tags: project.technologies,
    categories: project.categories ?? [],
    coverUrl: project.media?.imageUrl ?? "",
    thumbnailUrl: project.media?.thumbnailUrl ?? "",
    gallery: project.media?.gallery ?? [],
    projectStatus: project.status ?? "completed",
    startDate: project.startDate?.slice(0, 10) ?? "",
    endDate: project.endDate?.slice(0, 10) ?? "",
    technologies: project.technologies,
    role: project.role ?? "",
    client: project.client ?? "",
    liveUrl: project.links?.live ?? "",
    repoUrl: project.links?.repo ?? "",
    docsUrl: project.links?.docs ?? "",
    videoUrl: project.links?.video ?? "",
    draftRevision: project.draftRevision,
    publishedDraftRevision: project.publishedDraftRevision,
    publishedVersion: project.publishedVersion,
    publishedAt: project.publishedAt,
    hasUnpublishedChanges: !!project.hasUnpublishedChanges,
    updatedAt: project.updatedAt,
  };
};

const optional = (value: string) => value.trim() || undefined;

export const editorialPayload = (draft: EditorialDraft) => {
  const common = {
    title: draft.title.trim() || "Untitled",
    slug: optional(draft.slug),
    date: draft.date || today(),
    content: draft.content,
    categories: draft.categories,
    isFeatured: draft.isFeatured,
    media: {
      thumbnailUrl: optional(draft.thumbnailUrl),
      imageUrl: optional(draft.coverUrl),
      gallery: draft.gallery,
    },
  };

  if (draft.kind === "notes") {
    return {
      ...common,
      excerpt: draft.summary.trim(),
      author: optional(draft.author),
      readTimeMin: draft.readTimeMin ?? estimateReadTime(draft.content),
      tags: draft.tags,
      links: {
        canonical: optional(draft.canonicalUrl),
        discussion: optional(draft.discussionUrl),
      },
    };
  }

  return {
    ...common,
    subtitle: optional(draft.summary),
    description: optional(draft.summary),
    status: draft.projectStatus,
    startDate: optional(draft.startDate),
    endDate: optional(draft.endDate),
    technologies: draft.technologies,
    role: optional(draft.role),
    client: optional(draft.client),
    links: {
      live: optional(draft.liveUrl),
      repo: optional(draft.repoUrl),
      docs: optional(draft.docsUrl),
      video: optional(draft.videoUrl),
    },
  };
};

export const estimateReadTime = (markdown: string) => {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return words ? Math.max(1, Math.ceil(words / 220)) : 0;
};

export const extractHeadings = (markdown: string) =>
  markdown
    .split("\n")
    .map((line) => /^(#{2,3})\s+(.+)$/.exec(line))
    .filter((match): match is RegExpExecArray => !!match)
    .map((match) => ({ level: match[1].length, title: match[2].trim() }));

export const previewFromDraft = (draft: EditorialDraft): Project | Note => {
  const payload = editorialPayload(draft);
  return {
    ...payload,
    _id: draft._id ?? "preview",
    slug: draft.slug || "preview",
  } as Project | Note;
};
