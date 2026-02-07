import {
  ObjectId,
  type Collection,
  type Filter,
  type OptionalId,
} from "mongodb";

import {
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
  Project,
  ResumeData,
  TimelineEntry,
} from "@/types";

type CollectionData<T> = T extends "resume"
  ? ResumeData | null
  : T extends "projects"
    ? Project[]
    : T extends "articles"
      ? Article[]
      : TimelineEntry[];

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
  input: Project | Record<string, unknown>,
  slug: string,
  now: Date,
): OptionalId<ProjectDocument> => {
  const data = input as Partial<Project>;
  const { title, date, technologies, ...rest } = data;
  const cleanRest = { ...(rest as Record<string, unknown>) };
  delete cleanRest.id;
  delete cleanRest._id;
  const createdAt = asDate((input as { createdAt?: unknown }).createdAt);

  const doc: OptionalId<ProjectDocument> = {
    ...cleanRest,
    slug,
    title: asString(title) ?? "Untitled project",
    date: coerceDateString(date, now.toISOString()),
    technologies: coerceStringArray(technologies),
    createdAt: createdAt ?? now,
    updatedAt: now,
  };
  return doc;
};

const buildArticleDocument = (
  input: Article | Record<string, unknown>,
  slug: string,
  now: Date,
): OptionalId<ArticleDocument> => {
  const data = input as Partial<Article>;
  const { title, excerpt, content, date, tags, metrics, ...rest } = data;
  const cleanRest = { ...(rest as Record<string, unknown>) };
  delete cleanRest.id;
  delete cleanRest._id;
  const createdAt = asDate((input as { createdAt?: unknown }).createdAt);

  const doc: OptionalId<ArticleDocument> = {
    ...cleanRest,
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
  return doc;
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
  void _createdAt;
  void _updatedAt;
  void _order;
  return { ...rest, _id: _mongoId ? String(_mongoId) : "" } as Project;
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
  void _createdAt;
  void _updatedAt;
  void _order;
  return { ...rest, _id: _mongoId ? String(_mongoId) : "" } as Article;
};

const stripTimeline = (
  doc: TimelineDocument | null | undefined,
): TimelineEntry | null => {
  if (!doc) return null;
  const {
    _id: _mongoId,
    order: _order,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = doc;
  void _mongoId;
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
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = doc;
  void _mongoId;
  void _createdAt;
  void _updatedAt;
  return rest as ResumeData;
};

const ensureUniqueSlugDb = async <T extends { slug?: string }>(
  collection: Collection<T>,
  base: string,
  excludeObjectId?: ObjectId,
): Promise<string> => {
  let candidate = base || "item";
  let suffix = 2;
  while (true) {
    const filter: Filter<T> =
      excludeObjectId != null
        ? ({
            slug: candidate,
            _id: { $ne: excludeObjectId },
          } as unknown as Filter<T>)
        : ({ slug: candidate } as unknown as Filter<T>);
    const existing = await collection.findOne(filter, {
      projection: { _id: 1 },
    });
    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

const parseObjectId = (value: string): ObjectId | null => {
  if (!value || typeof value !== "string") return null;
  try {
    return ObjectId.isValid(value) ? new ObjectId(value) : null;
  } catch {
    return null;
  }
};

const buildTimelineDocs = (items: TimelineEntry[]) => {
  const now = new Date();
  return items.map((item, idx) => {
    return {
      ...item,
      order: idx,
      createdAt: now,
      updatedAt: now,
    };
  });
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
  const collection = await getProjectsCollection();
  const docs = await collection.find().sort({ date: -1, title: 1 }).toArray();
  if (!docs.length) {
    console.info("No project entries found in the database.");
    return [];
  }
  return docs.map((doc) => stripProject(doc)!).filter(Boolean);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const collection = await getProjectsCollection();
  const objectId = parseObjectId(slug);
  const doc = await collection.findOne(
    objectId ? { $or: [{ slug }, { _id: objectId }] } : { slug },
  );
  if (!doc) {
    console.info("No project entry found for the requested slug or id.");
    return null;
  }
  return stripProject(doc);
}

export async function getAllArticles(): Promise<Article[]> {
  const collection = await getArticlesCollection();
  const docs = await collection.find().sort({ date: -1, title: 1 }).toArray();
  if (!docs.length) {
    console.info("No article entries found in the database.");
    return [];
  }
  return docs.map((doc) => stripArticle(doc)!).filter(Boolean);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const collection = await getArticlesCollection();
  const objectId = parseObjectId(slug);
  const doc = await collection.findOne(
    objectId ? { $or: [{ slug }, { _id: objectId }] } : { slug },
  );
  if (!doc) {
    console.info("No article entry found for the requested slug or id.");
    return null;
  }
  return stripArticle(doc);
}

export async function getExperiences(): Promise<TimelineEntry[]> {
  const collection = await getExperiencesCollection();
  const docs = await collection
    .find()
    .sort({ order: 1, date: -1, _id: 1 })
    .toArray();
  if (!docs.length) {
    console.info("No experience entries found in the database.");
    return [];
  }
  return docs.map((doc) => stripTimeline(doc)!).filter(Boolean);
}

export async function getStudies(): Promise<TimelineEntry[]> {
  const collection = await getStudiesCollection();
  const docs = await collection
    .find()
    .sort({ order: 1, date: -1, _id: 1 })
    .toArray();
  if (!docs.length) {
    console.info("No study entries found in the database.");
    return [];
  }
  return docs.map((doc) => stripTimeline(doc)!).filter(Boolean);
}

export async function getResume(): Promise<ResumeData | null> {
  const collection = await getResumeCollection();
  const doc = await collection.findOne(
    {},
    { sort: { createdAt: -1, _id: -1 } },
  );
  if (!doc) {
    console.info("No resume entry found in the database.");
    return null;
  }
  return stripResume(doc);
}

export async function upsertResume(
  patch: Partial<ResumeData>,
): Promise<ResumeData> {
  const collection = await getResumeCollection();
  const existing = await collection.findOne(
    {},
    { sort: { createdAt: -1, _id: -1 } },
  );
  const now = new Date();
  if (!existing) {
    const doc = { ...(patch as ResumeData), createdAt: now, updatedAt: now };
    await collection.insertOne(doc);
    return doc;
  }
  const { _id, ...rest } = existing;
  const updated = { ...rest, ...patch };
  await collection.updateOne({ _id }, { $set: { ...updated, updatedAt: now } });
  return updated as ResumeData;
}

export async function replaceResume(data: ResumeData): Promise<void> {
  const collection = await getResumeCollection();
  const existing = await collection.findOne(
    {},
    { sort: { createdAt: -1, _id: -1 } },
  );
  const now = new Date();
  if (!existing) {
    await collection.insertOne({ ...data, createdAt: now, updatedAt: now });
    return;
  }
  await collection.updateOne(
    { _id: existing._id },
    { $set: { ...data, updatedAt: now } },
  );
}

export async function createProjectOrArticle(
  collection: Extract<AdminCollectionName, "projects" | "articles">,
  item: Record<string, unknown>,
): Promise<{ _id: string; item: Project | Article }> {
  if (collection === "projects") {
    const col = await getProjectsCollection();
    const title = asString(item.title);
    const slugCandidate = asString(item.slug);
    const slug = await ensureUniqueSlugDb(
      col,
      slugify(slugCandidate || title || "project"),
    );
    const now = new Date();
    const doc = buildProjectDocument(item, slug, now);
    const result = await col.insertOne(doc);
    const inserted = { ...doc, _id: result.insertedId };
    return { _id: String(result.insertedId), item: stripProject(inserted)! };
  }

  const col = await getArticlesCollection();
  const title = asString(item.title);
  const slugCandidate = asString(item.slug);
  const slug = await ensureUniqueSlugDb(
    col,
    slugify(slugCandidate || title || "article"),
  );
  const now = new Date();
  const doc = buildArticleDocument(item, slug, now);
  const result = await col.insertOne(doc);
  const inserted = { ...doc, _id: result.insertedId };
  return { _id: String(result.insertedId), item: stripArticle(inserted)! };
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
    const col = await getProjectsCollection();
    const objectId = parseObjectId(itemId);
    if (!objectId) throw new Error("Invalid item id");
    const existing = await col.findOne({ _id: objectId });
    if (!existing) throw new Error("Item not found");

    const safePatch = { ...(patch as Record<string, unknown>) };
    delete safePatch._id;
    delete safePatch.id;
    const updates: Record<string, unknown> = {
      ...safePatch,
      updatedAt: new Date(),
    };
    if (patch.slug) {
      updates.slug = await ensureUniqueSlugDb(
        col,
        slugify(String(patch.slug)),
        objectId,
      );
    }

    const updated = await col.findOneAndUpdate(
      { _id: objectId },
      { $set: updates },
      { returnDocument: "after" },
    );
    if (!updated) throw new Error("Item not found");
    return stripProject(updated)! as Project;
  }

  if (collection === "articles") {
    const col = await getArticlesCollection();
    const objectId = parseObjectId(itemId);
    if (!objectId) throw new Error("Invalid item id");
    const existing = await col.findOne({ _id: objectId });
    if (!existing) throw new Error("Item not found");

    const safePatch = { ...(patch as Record<string, unknown>) };
    delete safePatch._id;
    delete safePatch.id;
    const updates: Record<string, unknown> = {
      ...safePatch,
      updatedAt: new Date(),
    };
    if (patch.slug) {
      updates.slug = await ensureUniqueSlugDb(
        col,
        slugify(String(patch.slug)),
        objectId,
      );
    }

    const updated = await col.findOneAndUpdate(
      { _id: objectId },
      { $set: updates },
      { returnDocument: "after" },
    );
    if (!updated) throw new Error("Item not found");
    return stripArticle(updated)! as Article;
  }

  // experiences or studies (index-based in admin UI)
  const col =
    collection === "experiences"
      ? await getExperiencesCollection()
      : await getStudiesCollection();
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
    filter = { _id: doc._id };
  } else {
    const objectId = parseObjectId(itemId);
    if (!objectId) throw new Error("Invalid item id");
    filter = { _id: objectId };
  }

  const updated = await col.findOneAndUpdate(
    filter,
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!updated) throw new Error("Item not found");
  return stripTimeline(updated)!;
}

const resequenceTimeline = async (col: Collection<TimelineDocument>) => {
  const docs = await col
    .find({}, { projection: { _id: 1 } })
    .sort({ order: 1, date: -1, _id: 1 })
    .toArray();
  if (!docs.length) return;
  const bulk = docs.map((doc, idx) => ({
    updateOne: { filter: { _id: doc._id }, update: { $set: { order: idx } } },
  }));
  await col.bulkWrite(bulk);
};

export async function deleteItem(
  collection: AdminListCollectionName,
  itemId: string,
): Promise<Project | Article | TimelineEntry> {
  if (collection === "projects") {
    const col = await getProjectsCollection();
    const objectId = parseObjectId(itemId);
    if (!objectId) throw new Error("Invalid item id");
    const deleted = await col.findOneAndDelete({ _id: objectId });
    if (!deleted) throw new Error("Item not found");
    return stripProject(deleted)! as Project;
  }

  if (collection === "articles") {
    const col = await getArticlesCollection();
    const objectId = parseObjectId(itemId);
    if (!objectId) throw new Error("Invalid item id");
    const deleted = await col.findOneAndDelete({ _id: objectId });
    if (!deleted) throw new Error("Item not found");
    return stripArticle(deleted)! as Article;
  }

  const col =
    collection === "experiences"
      ? await getExperiencesCollection()
      : await getStudiesCollection();
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
    filter = { _id: doc._id };
  } else {
    const objectId = parseObjectId(itemId);
    if (!objectId) throw new Error("Invalid item id");
    filter = { _id: objectId };
  }
  const deleted = await col.findOneAndDelete(filter);
  if (!deleted) throw new Error("Item not found");
  await resequenceTimeline(col);
  return stripTimeline(deleted)!;
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
    const slugs = new Set<string>();
    const now = new Date();
    const docs = (payload as unknown[]).map((item, idx) => {
      if (!item || typeof item !== "object") {
        throw new Error("Each item must be an object");
      }
      const record = { ...(item as Record<string, unknown>) };
      delete (record as Record<string, unknown>)._id;
      delete (record as Record<string, unknown>).id;
      const title = asString(record.title);
      const slugSource = asString(record.slug) || title || `${name}-${idx + 1}`;
      const slug = ensureUniqueInSet(slugs, slugify(slugSource));

      return buildProjectDocument(record, slug, now);
    });

    await col.deleteMany({});
    if (docs.length) {
      await col.insertMany(docs);
    }
    return;
  }

  if (name === "articles") {
    const col = await getArticlesCollection();
    const slugs = new Set<string>();
    const now = new Date();
    const docs = (payload as unknown[]).map((item, idx) => {
      if (!item || typeof item !== "object") {
        throw new Error("Each item must be an object");
      }
      const record = { ...(item as Record<string, unknown>) };
      delete (record as Record<string, unknown>)._id;
      delete (record as Record<string, unknown>).id;
      const title = asString(record.title);
      const slugSource = asString(record.slug) || title || `${name}-${idx + 1}`;
      const slug = ensureUniqueInSet(slugs, slugify(slugSource));

      return buildArticleDocument(record, slug, now);
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
  const docs = buildTimelineDocs(payload as TimelineEntry[]);
  await col.deleteMany({});
  if (docs.length) {
    await col.insertMany(docs);
  }
}

// Re-export types for downstream API routes
export type { AdminCollectionName, AdminListCollectionName } from "@/types";
