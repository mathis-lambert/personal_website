import { promises as fs } from "fs";
import path from "path";
import type { Collection, Filter } from "mongodb";

import {
  DEFAULT_RESUME_ID,
  type ArticleDocument,
  type ProjectDocument,
  type ResumeDocument,
  type TimelineDocument,
  getArticlesCollection,
  getExperiencesCollection,
  getProjectsCollection,
  getResumeCollection,
  getStudiesCollection,
} from "@/lib/db/collections";
import type {
  AdminCollectionName,
  AdminListCollectionName,
  Article,
  ArticleMetrics,
  Project,
  ResumeData,
  TimelineEntry,
} from "@/types";

const DATA_DIR = path.join(process.cwd(), "app", "data");
const SEED_FILES = {
  projects: "projects.json",
  articles: "articles.json",
  experiences: "experiences.json",
  studies: "studies.json",
  resume: "resume.json",
} as const;

type SeedCollectionName = keyof typeof SEED_FILES;

type CollectionData<T> = T extends "resume"
  ? ResumeData | null
  : T extends "projects"
    ? Project[]
    : T extends "articles"
      ? Article[]
      : TimelineEntry[];

const seedPromises: Partial<Record<SeedCollectionName, Promise<void>>> = {};

const slugify = (value: string): string => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "item";
};

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const asDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const coerceDateString = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim()
    ? value
    : value instanceof Date
      ? value.toISOString()
      : fallback;

const coerceStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === "string" ? item : String(item)))
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const buildProjectDocument = (
  input: Record<string, unknown>,
  id: string,
  slug: string,
  now: Date,
): ProjectDocument => {
  const data = input as Partial<Project>;
  const { title, date, technologies, ...rest } = data;
  const createdAt = asDate((input as { createdAt?: unknown }).createdAt);

  return {
    ...rest,
    id,
    slug,
    title: asString(title) ?? "Untitled project",
    date: coerceDateString(date, now.toISOString()),
    technologies: coerceStringArray(technologies),
    createdAt: createdAt ?? now,
    updatedAt: now,
  };
};

const buildArticleDocument = (
  input: Record<string, unknown>,
  id: string,
  slug: string,
  now: Date,
): ArticleDocument => {
  const data = input as Partial<Article>;
  const { title, excerpt, content, date, tags, metrics, ...rest } = data;
  const createdAt = asDate((input as { createdAt?: unknown }).createdAt);

  return {
    ...rest,
    id,
    slug,
    title: asString(title) ?? "Untitled article",
    excerpt: asString(excerpt) ?? "",
    content: asString(content) ?? "",
    date: coerceDateString(date, now.toISOString()),
    tags: coerceStringArray(tags),
    metrics: metrics ?? { views: 0, likes: 0, shares: 0 },
    createdAt: createdAt ?? now,
    updatedAt: now,
  };
};

const parseIndex = (itemId: string): number | null => {
  try {
    if (itemId.startsWith("index-")) return parseInt(itemId.split("-")[1]!, 10);
    const parsed = parseInt(itemId, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const ensureUniqueInSet = (set: Set<string>, base: string): string => {
  let candidate = base || "item";
  let suffix = 2;
  while (set.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  set.add(candidate);
  return candidate;
};

const stripProject = (
  doc: ProjectDocument | null | undefined,
): Project | null => {
  if (!doc) return null;
  const {
    _id: _mongoId,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    order: _order,
    ...rest
  } = doc;
  void _mongoId;
  void _createdAt;
  void _updatedAt;
  void _order;
  return rest as Project;
};

const stripArticle = (
  doc: ArticleDocument | null | undefined,
): Article | null => {
  if (!doc) return null;
  const {
    _id: _mongoId,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    order: _order,
    ...rest
  } = doc;
  void _mongoId;
  void _createdAt;
  void _updatedAt;
  void _order;
  return rest as Article;
};

const stripTimeline = (
  doc: TimelineDocument | null | undefined,
): TimelineEntry | null => {
  if (!doc) return null;
  const {
    _id: _mongoId,
    id: _id,
    order: _order,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = doc;
  void _mongoId;
  void _id;
  void _order;
  void _createdAt;
  void _updatedAt;
  return rest as TimelineEntry;
};

const stripResume = (
  doc: ResumeDocument | null | undefined,
): ResumeData | null => {
  if (!doc) return null;
  const {
    _id: _mongoId,
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = doc;
  void _mongoId;
  void _id;
  void _createdAt;
  void _updatedAt;
  return rest as ResumeData;
};

const readSeed = async <T>(name: SeedCollectionName): Promise<T | null> => {
  try {
    const raw = await fs.readFile(
      path.join(DATA_DIR, SEED_FILES[name]),
      "utf-8",
    );
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    if (error?.code === "ENOENT") return null;
    throw err;
  }
};

const ensureUniqueFieldDb = async <T extends { id?: string; slug?: string }>(
  collection: Collection<T>,
  key: "id" | "slug",
  base: string,
  excludeId?: string,
): Promise<string> => {
  let candidate = base || "item";
  let suffix = 2;
  while (true) {
    const filter: Filter<T> =
      excludeId != null
        ? ({ [key]: candidate, id: { $ne: excludeId } } as unknown as Filter<T>)
        : ({ [key]: candidate } as unknown as Filter<T>);
    const existing = await collection.findOne(filter, {
      projection: { _id: 1 },
    });
    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

const buildTimelineDocs = (
  items: TimelineEntry[],
  collection: "experiences" | "studies",
) => {
  const ids = new Set<string>();
  const now = new Date();
  return items.map((item, idx) => {
    const base = slugify(
      `${item.title || collection}-${item.company || ""}-${item.date || idx}`,
    );
    const id = ensureUniqueInSet(ids, base);
    return {
      ...item,
      id,
      order: idx,
      createdAt: now,
      updatedAt: now,
    };
  });
};

const seedTasks: Record<SeedCollectionName, () => Promise<void>> = {
  projects: async () => {
    const collection = await getProjectsCollection();
    if ((await collection.estimatedDocumentCount()) > 0) return;
    const seed = await readSeed<Project[]>("projects");
    if (!seed?.length) return;

    const ids = new Set<string>();
    const slugs = new Set<string>();
    const now = new Date();
    const docs = seed.map((item, idx) => {
      const baseId = item.id || slugify(item.title || `project-${idx}`);
      const id = ensureUniqueInSet(ids, String(baseId));
      const baseSlug = slugify(item.slug || item.title || id);
      const slug = ensureUniqueInSet(slugs, baseSlug);
      return { ...item, id, slug, createdAt: now, updatedAt: now };
    });
    await collection.insertMany(docs);
  },
  articles: async () => {
    const collection = await getArticlesCollection();
    if ((await collection.estimatedDocumentCount()) > 0) return;
    const seed = await readSeed<Article[]>("articles");
    if (!seed?.length) return;

    const ids = new Set<string>();
    const slugs = new Set<string>();
    const now = new Date();
    const docs = seed.map((item, idx) => {
      const baseId = item.id || slugify(item.title || `article-${idx}`);
      const id = ensureUniqueInSet(ids, String(baseId));
      const baseSlug = slugify(item.slug || item.title || id);
      const slug = ensureUniqueInSet(slugs, baseSlug);
      return { ...item, id, slug, createdAt: now, updatedAt: now };
    });
    await collection.insertMany(docs);
  },
  experiences: async () => {
    const collection = await getExperiencesCollection();
    if ((await collection.estimatedDocumentCount()) > 0) return;
    const seed = await readSeed<TimelineEntry[]>("experiences");
    if (!seed?.length) return;
    const docs = buildTimelineDocs(seed, "experiences");
    await collection.insertMany(docs);
  },
  studies: async () => {
    const collection = await getStudiesCollection();
    if ((await collection.estimatedDocumentCount()) > 0) return;
    const seed = await readSeed<TimelineEntry[]>("studies");
    if (!seed?.length) return;
    const docs = buildTimelineDocs(seed, "studies");
    await collection.insertMany(docs);
  },
  resume: async () => {
    const collection = await getResumeCollection();
    if ((await collection.estimatedDocumentCount()) > 0) return;
    const seed = await readSeed<ResumeData>("resume");
    if (!seed) return;
    const now = new Date();
    await collection.insertOne({
      ...seed,
      id: DEFAULT_RESUME_ID,
      createdAt: now,
      updatedAt: now,
    });
  },
};

const ensureSeeded = async (name: SeedCollectionName) => {
  if (!seedPromises[name]) {
    seedPromises[name] = seedTasks[name]();
  }
  return seedPromises[name];
};

export const listCollections = (): AdminCollectionName[] => [
  "projects",
  "articles",
  "experiences",
  "studies",
  "resume",
];

export async function getCollection<T extends AdminCollectionName>(
  name: T,
): Promise<CollectionData<T>> {
  switch (name) {
    case "projects":
      return (await getAllProjects()) as CollectionData<T>;
    case "articles":
      return (await getAllArticles()) as CollectionData<T>;
    case "experiences":
      return (await getExperiences()) as CollectionData<T>;
    case "studies":
      return (await getStudies()) as CollectionData<T>;
    case "resume":
      return (await getResume()) as CollectionData<T>;
    default:
      throw new Error(`Unknown collection: ${name as string}`);
  }
}

export async function getAllProjects(): Promise<Project[]> {
  await ensureSeeded("projects");
  const collection = await getProjectsCollection();
  const docs = await collection.find().sort({ date: -1, title: 1 }).toArray();
  return docs.map((doc) => stripProject(doc)!).filter(Boolean);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  await ensureSeeded("projects");
  const collection = await getProjectsCollection();
  const doc = await collection.findOne({
    $or: [{ slug }, { id: slug }],
  });
  return stripProject(doc);
}

export async function getAllArticles(): Promise<Article[]> {
  await ensureSeeded("articles");
  const collection = await getArticlesCollection();
  const docs = await collection.find().sort({ date: -1, title: 1 }).toArray();
  return docs.map((doc) => stripArticle(doc)!).filter(Boolean);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  await ensureSeeded("articles");
  const collection = await getArticlesCollection();
  const doc = await collection.findOne({
    $or: [{ slug }, { id: slug }],
  });
  return stripArticle(doc);
}

export async function updateArticleMetric(
  eventType: "like" | "share" | "read",
  payload: { id?: string; slug?: string },
): Promise<ArticleMetrics | null> {
  await ensureSeeded("articles");
  const collection = await getArticlesCollection();
  const filter = payload.id
    ? { id: payload.id }
    : payload.slug
      ? { slug: payload.slug }
      : null;
  if (!filter) return null;
  const incKey =
    eventType === "like"
      ? "metrics.likes"
      : eventType === "share"
        ? "metrics.shares"
        : "metrics.views";
  const result = await collection.findOneAndUpdate(
    filter,
    {
      $inc: { [incKey]: 1 },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" },
  );
  if (!result || !result.value) return null;
  const metrics = result.value.metrics || {};
  return {
    views: metrics.views ?? 0,
    likes: metrics.likes ?? 0,
    shares: metrics.shares ?? 0,
  };
}

export async function getArticleMetrics(payload: {
  id?: string;
  slug?: string;
}): Promise<ArticleMetrics | null> {
  await ensureSeeded("articles");
  const collection = await getArticlesCollection();
  const filter = payload.id
    ? { id: payload.id }
    : payload.slug
      ? { slug: payload.slug }
      : null;
  if (!filter) return null;
  const doc = await collection.findOne(filter, { projection: { metrics: 1 } });
  if (!doc) return null;
  const metrics = doc.metrics || {};
  return {
    views: metrics.views ?? 0,
    likes: metrics.likes ?? 0,
    shares: metrics.shares ?? 0,
  };
}

export async function getExperiences(): Promise<TimelineEntry[]> {
  await ensureSeeded("experiences");
  const collection = await getExperiencesCollection();
  const docs = await collection
    .find()
    .sort({ order: 1, date: -1, _id: 1 })
    .toArray();
  return docs.map((doc) => stripTimeline(doc)!).filter(Boolean);
}

export async function getStudies(): Promise<TimelineEntry[]> {
  await ensureSeeded("studies");
  const collection = await getStudiesCollection();
  const docs = await collection
    .find()
    .sort({ order: 1, date: -1, _id: 1 })
    .toArray();
  return docs.map((doc) => stripTimeline(doc)!).filter(Boolean);
}

export async function getResume(): Promise<ResumeData | null> {
  await ensureSeeded("resume");
  const collection = await getResumeCollection();
  const doc = await collection.findOne({ id: DEFAULT_RESUME_ID });
  return stripResume(doc);
}

export async function upsertResume(
  patch: Partial<ResumeData>,
): Promise<ResumeData> {
  const collection = await getResumeCollection();
  const current = ((await getResume()) || {}) as ResumeData;
  const updated = { ...current, ...patch } as ResumeData;
  await collection.updateOne(
    { id: DEFAULT_RESUME_ID },
    {
      $set: { ...updated, id: DEFAULT_RESUME_ID, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
  return updated;
}

export async function replaceResume(data: ResumeData): Promise<void> {
  const collection = await getResumeCollection();
  await collection.updateOne(
    { id: DEFAULT_RESUME_ID },
    {
      $set: { ...data, id: DEFAULT_RESUME_ID, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
}

export async function createProjectOrArticle(
  collection: Extract<AdminCollectionName, "projects" | "articles">,
  item: Record<string, unknown>,
): Promise<{ id: string; item: Project | Article }> {
  if (collection === "projects") {
    await ensureSeeded("projects");
    const col = await getProjectsCollection();
    const title = asString(item.title);
    const slugCandidate = asString(item.slug);
    const baseId = asString(item.id) || slugify(title || "project");
    const id = await ensureUniqueFieldDb(col, "id", String(baseId));
    const slug = await ensureUniqueFieldDb(
      col,
      "slug",
      slugify(slugCandidate || title || baseId),
    );
    const now = new Date();
    const doc = buildProjectDocument(item, id, slug, now);
    await col.insertOne(doc);
    return { id, item: stripProject(doc)! };
  }

  await ensureSeeded("articles");
  const col = await getArticlesCollection();
  const title = asString(item.title);
  const slugCandidate = asString(item.slug);
  const baseId = asString(item.id) || slugify(title || "article");
  const id = await ensureUniqueFieldDb(col, "id", String(baseId));
  const slug = await ensureUniqueFieldDb(
    col,
    "slug",
    slugify(slugCandidate || title || baseId),
  );
  const now = new Date();
  const doc = buildArticleDocument(item, id, slug, now);
  await col.insertOne(doc);
  return { id, item: stripArticle(doc)! };
}

export async function updateItem(
  collection: AdminCollectionName,
  itemId: string,
  patch: Record<string, unknown>,
): Promise<Project | Article | TimelineEntry | ResumeData> {
  if (collection === "resume") {
    const updated = await upsertResume(patch as Partial<ResumeData>);
    return updated;
  }

  if (collection === "projects") {
    await ensureSeeded("projects");
    const col = await getProjectsCollection();
    const existing = await col.findOne({ id: itemId });
    if (!existing) throw new Error("Item not found");

    const updates: Record<string, unknown> = {
      ...patch,
      updatedAt: new Date(),
    };
    if (patch.slug) {
      updates.slug = await ensureUniqueFieldDb(
        col,
        "slug",
        slugify(String(patch.slug)),
        existing.id,
      );
    }
    if (patch.id) {
      updates.id = await ensureUniqueFieldDb(
        col,
        "id",
        String(patch.id),
        existing.id,
      );
    }

    const result = await col.findOneAndUpdate(
      { id: itemId },
      { $set: updates },
      { returnDocument: "after" },
    );
    if (!result) throw new Error("Update failed");
    const updated = result.value;
    if (!updated) throw new Error("Item not found");
    return stripProject(updated)! as Project;
  }

  if (collection === "articles") {
    await ensureSeeded("articles");
    const col = await getArticlesCollection();
    const existing = await col.findOne({ id: itemId });
    if (!existing) throw new Error("Item not found");

    const updates: Record<string, unknown> = {
      ...patch,
      updatedAt: new Date(),
    };
    if (patch.slug) {
      updates.slug = await ensureUniqueFieldDb(
        col,
        "slug",
        slugify(String(patch.slug)),
        existing.id,
      );
    }
    if (patch.id) {
      updates.id = await ensureUniqueFieldDb(
        col,
        "id",
        String(patch.id),
        existing.id,
      );
    }

    const result = await col.findOneAndUpdate(
      { id: itemId },
      { $set: updates },
      { returnDocument: "after" },
    );
    if (!result) throw new Error("Update failed");
    const updated = result.value;
    if (!updated) throw new Error("Item not found");
    return stripArticle(updated)! as Article;
  }

  // experiences or studies (index-based in admin UI)
  const col =
    collection === "experiences"
      ? await getExperiencesCollection()
      : await getStudiesCollection();
  await ensureSeeded(collection);
  const idx = parseIndex(itemId);
  let filter: Record<string, unknown>;
  if (idx != null) {
    const doc = await col
      .find()
      .sort({ order: 1, date: -1, _id: 1 })
      .skip(idx)
      .limit(1)
      .next();
    if (!doc) throw new Error("Item not found");
    filter = { id: doc.id };
  } else {
    filter = { id: itemId };
  }

  const result = await col.findOneAndUpdate(
    filter,
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!result) throw new Error("Update failed");
  if (!result.value) throw new Error("Item not found");
  return stripTimeline(result.value)!;
}

const resequenceTimeline = async (col: Collection<TimelineDocument>) => {
  const docs = await col
    .find({}, { projection: { id: 1 } })
    .sort({ order: 1, date: -1, _id: 1 })
    .toArray();
  if (!docs.length) return;
  const bulk = docs.map((doc, idx) => ({
    updateOne: { filter: { id: doc.id }, update: { $set: { order: idx } } },
  }));
  await col.bulkWrite(bulk);
};

export async function deleteItem(
  collection: AdminListCollectionName,
  itemId: string,
): Promise<Project | Article | TimelineEntry> {
  if (collection === "projects") {
    await ensureSeeded("projects");
    const col = await getProjectsCollection();
    const result = await col.findOneAndDelete({ id: itemId });
    if (!result) throw new Error("Delete failed");
    const deleted = result.value;
    if (!deleted) throw new Error("Item not found");
    return stripProject(deleted)! as Project;
  }

  if (collection === "articles") {
    await ensureSeeded("articles");
    const col = await getArticlesCollection();
    const result = await col.findOneAndDelete({ id: itemId });
    if (!result) throw new Error("Delete failed");
    const deleted = result.value;
    if (!deleted) throw new Error("Item not found");
    return stripArticle(deleted)! as Article;
  }

  const col =
    collection === "experiences"
      ? await getExperiencesCollection()
      : await getStudiesCollection();
  await ensureSeeded(collection);
  const idx = parseIndex(itemId);
  let filter: Record<string, unknown>;
  if (idx != null) {
    const doc = await col
      .find()
      .sort({ order: 1, date: -1, _id: 1 })
      .skip(idx)
      .limit(1)
      .next();
    if (!doc) throw new Error("Item not found");
    filter = { id: doc.id };
  } else {
    filter = { id: itemId };
  }
  const result = await col.findOneAndDelete(filter);
  if (!result) throw new Error("Delete failed");
  if (!result.value) throw new Error("Item not found");
  await resequenceTimeline(col);
  return stripTimeline(result.value)!;
}

export async function replaceCollection(
  name: AdminCollectionName,
  payload: unknown,
): Promise<void> {
  if (name === "resume") {
    if (!payload || typeof payload !== "object") {
      throw new Error("Payload for resume must be an object");
    }
    await replaceResume(payload as ResumeData);
    return;
  }

  if (!Array.isArray(payload)) {
    throw new Error("Payload must be an array for this collection");
  }

  if (name === "projects") {
    const col = await getProjectsCollection();
    const ids = new Set<string>();
    const slugs = new Set<string>();
    const now = new Date();
    const docs = (payload as unknown[]).map((item, idx) => {
      if (!item || typeof item !== "object") {
        throw new Error("Each item must be an object");
      }
      const record = item as Record<string, unknown>;
      const title = asString(record.title);
      const baseId = asString(record.id) || slugify(title || `${name}-${idx}`);
      const id = ensureUniqueInSet(ids, baseId);
      const slugSource = asString(record.slug) || title || id;
      const slug = ensureUniqueInSet(slugs, slugify(slugSource));

      return buildProjectDocument(record, id, slug, now);
    });

    await col.deleteMany({});
    if (docs.length) {
      await col.insertMany(docs);
    }
    return;
  }

  if (name === "articles") {
    const col = await getArticlesCollection();
    const ids = new Set<string>();
    const slugs = new Set<string>();
    const now = new Date();
    const docs = (payload as unknown[]).map((item, idx) => {
      if (!item || typeof item !== "object") {
        throw new Error("Each item must be an object");
      }
      const record = item as Record<string, unknown>;
      const title = asString(record.title);
      const baseId = asString(record.id) || slugify(title || `${name}-${idx}`);
      const id = ensureUniqueInSet(ids, baseId);
      const slugSource = asString(record.slug) || title || id;
      const slug = ensureUniqueInSet(slugs, slugify(slugSource));

      return buildArticleDocument(record, id, slug, now);
    });

    await col.deleteMany({});
    if (docs.length) {
      await col.insertMany(docs);
    }
    return;
  }

  // experiences or studies
  const col =
    name === "experiences"
      ? await getExperiencesCollection()
      : await getStudiesCollection();
  const docs = buildTimelineDocs(payload as TimelineEntry[], name);
  await col.deleteMany({});
  if (docs.length) {
    await col.insertMany(docs);
  }
}

// Re-export types for downstream API routes
export type { AdminCollectionName, AdminListCollectionName } from "@/types";
