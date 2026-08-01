import {
  ObjectId,
  type Collection,
  type OptionalId,
} from "mongodb";

import {
  type EditorialContentDocument,
  type NoteDocument,
  type ProjectDocument,
  type ResumeDocument,
  type TimelineDocument,
  getEditorialContentCollection,
  getNotesCollection,
  getExperiencesCollection,
  getProjectsCollection,
  getResumeCollection,
  getStudiesCollection,
} from "@/lib/db/collections";
import {
  deleteContentPublications,
  deleteCollectionPublications,
  getPublishedItem,
  getPublishedItems,
  isPublishedSlugInUse,
  serializeEditorialDocument,
  withoutEditorialInternals,
} from "@/lib/data/publications";
import type {
  Note,
  Project,
  TimelineEntry,
} from "@/types/content";
import type {
  AdminCollectionName,
  AdminListCollectionName,
} from "@/types/admin";
import type { ResumeData } from "@/types/resume";

type CollectionData<T> = T extends "resume"
  ? ResumeData | null
  : T extends "projects"
    ? Project[]
    : T extends "notes"
      ? Note[]
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
  const cleanRest = withoutEditorialInternals({
    ...(rest as Record<string, unknown>),
  });
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

const buildNoteDocument = (
  input: Note | Record<string, unknown>,
  slug: string,
  now: Date,
): OptionalId<NoteDocument> => {
  const data = input as Partial<Note>;
  const { title, excerpt, content, date, tags, metrics, ...rest } = data;
  const cleanRest = withoutEditorialInternals({
    ...(rest as Record<string, unknown>),
  });
  const createdAt = asDate((input as { createdAt?: unknown }).createdAt);

  const doc: OptionalId<NoteDocument> = {
    ...cleanRest,
    slug,
    title: asString(title) ?? "Untitled note",
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

/**
 * A stored document as the API hands it out: Mongo's bookkeeping dropped and the
 * ObjectId flattened to a string.
 */
const stripContent = serializeEditorialDocument;

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

const ensureUniqueSlugDb = async (
  collectionName: "projects" | "notes",
  collection: Collection<EditorialContentDocument>,
  base: string,
  excludeObjectId?: ObjectId,
): Promise<string> => {
  let candidate = base || "item";
  let suffix = 2;
  while (true) {
    const existing = await collection.findOne(
      {
        slug: candidate,
        ...(excludeObjectId ? { _id: { $ne: excludeObjectId } } : {}),
      },
      { projection: { _id: 1 } },
    );
    const publishedSlugExists = await isPublishedSlugInUse(
      collectionName,
      candidate,
      excludeObjectId,
    );
    if (!existing && !publishedSlugExists) return candidate;
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
  "notes",
  "experiences",
  "studies",
  "resume",
];

export async function getCollection<T extends AdminCollectionName>(
  name: T,
): Promise<CollectionData<T>> {
  switch (name) {
    case "projects":
      return (await getAllProjects({ includeUnpublished: true })) as CollectionData<T>;
    case "notes":
      return (await getAllNotes({ includeUnpublished: true })) as CollectionData<T>;
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

export async function getAllProjects(
  options: { includeUnpublished?: boolean } = {},
): Promise<Project[]> {
  if (!options.includeUnpublished) return getPublishedItems("projects");
  const collection = await getProjectsCollection();
  const docs = await collection
    .find()
    .sort({ date: -1, title: 1 })
    .toArray();
  if (!docs.length) {
    console.info("No project entries found in the database.");
    return [];
  }
  return docs.map((doc) => stripContent<Project>(doc)!).filter(Boolean);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return getPublishedItem("projects", slug);
}

export async function getAllNotes(
  options: { includeUnpublished?: boolean } = {},
): Promise<Note[]> {
  if (!options.includeUnpublished) return getPublishedItems("notes");
  const collection = await getNotesCollection();
  const docs = await collection
    .find()
    .sort({ date: -1, title: 1 })
    .toArray();
  if (!docs.length) {
    console.info("No note entries found in the database.");
    return [];
  }
  return docs.map((doc) => stripContent<Note>(doc)!).filter(Boolean);
}

export async function getNoteBySlug(slug: string): Promise<Note | null> {
  return getPublishedItem("notes", slug);
}

export async function getAdminContentItem(
  collection: "projects" | "notes",
  itemId: string,
): Promise<Project | Note | null> {
  const col = await openSlugCollection(collection);
  const objectId = parseObjectId(itemId);
  if (!objectId) return null;
  return stripContent<Project | Note>(await col.findOne({ _id: objectId }));
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

async function replaceResume(data: ResumeData): Promise<void> {
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

/**
 * The two slug-addressed content collections.
 *
 * `projects` and `notes` are the same kind of thing here: a document with a
 * unique slug, created, updated, deleted and replaced identically. The registry
 * is what lets create/update/delete/replace each have one branch instead of two.
 */
const slugCollections = {
  projects: {
    build: buildProjectDocument,
    fallbackSlug: "project",
  },
  notes: {
    build: buildNoteDocument,
    fallbackSlug: "note",
  },
} as const;

type SlugCollectionName = keyof typeof slugCollections;

const isSlugCollection = (name: string): name is SlugCollectionName =>
  name in slugCollections;

const openSlugCollection = async (name: SlugCollectionName) =>
  getEditorialContentCollection(name);

export async function createProjectOrNote(
  collection: SlugCollectionName,
  item: Record<string, unknown>,
): Promise<{ _id: string; item: Project | Note }> {
  const { build, fallbackSlug } = slugCollections[collection];
  const col = await openSlugCollection(collection);

  const slug = await ensureUniqueSlugDb(
    collection,
    col,
    slugify(asString(item.slug) || asString(item.title) || fallbackSlug),
  );
  const doc = build(item, slug, new Date());
  const draftDoc = {
    ...doc,
    editorialStatus: "draft" as const,
    draftRevision: 1,
  } as OptionalId<EditorialContentDocument>;
  const result = await col.insertOne(draftDoc);

  return {
    _id: String(result.insertedId),
    item: stripContent<Project | Note>({
      ...draftDoc,
      _id: result.insertedId,
    } as EditorialContentDocument)!,
  };
}

export async function updateItem(
  collection: AdminCollectionName,
  itemId: string,
  patch: Record<string, unknown>,
): Promise<Project | Note | TimelineEntry | ResumeData> {
  if (collection === "resume") {
    const updated = await upsertResume(patch as Partial<ResumeData>);
    return updated;
  }

  if (isSlugCollection(collection)) {
    const col = await openSlugCollection(collection);
    const objectId = parseObjectId(itemId);
    if (!objectId) throw new Error("Invalid item id");

    const safePatch = withoutEditorialInternals(patch);
    const updates: Record<string, unknown> = {
      ...safePatch,
      updatedAt: new Date(),
    };
    if (patch.slug) {
      updates.slug = await ensureUniqueSlugDb(
        collection,
        col,
        slugify(String(patch.slug)),
        objectId,
      );
    }

    const updated = await col.findOneAndUpdate(
      { _id: objectId },
      { $set: updates, $inc: { draftRevision: 1 } },
      { returnDocument: "after" },
    );
    if (!updated) throw new Error("Item not found");
    return stripContent<Project | Note>(updated)!;
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
): Promise<Project | Note | TimelineEntry> {
  if (isSlugCollection(collection)) {
    const col = await openSlugCollection(collection);
    const objectId = parseObjectId(itemId);
    if (!objectId) throw new Error("Invalid item id");
    const deleted = await col.findOneAndDelete({ _id: objectId });
    if (!deleted) throw new Error("Item not found");
    await deleteContentPublications(collection, objectId);
    return stripContent<Project | Note>(deleted)!;
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

  if (isSlugCollection(name)) {
    const { build } = slugCollections[name];
    const col = await openSlugCollection(name);
    const slugs = new Set<string>();
    const now = new Date();

    const docs = payload.map((item, index) => {
      if (!item || typeof item !== "object") {
        throw new Error("Each item must be an object");
      }
      const record = { ...(item as Record<string, unknown>) };
      delete record._id;
      delete record.id;
      const slugSource =
        asString(record.slug) || asString(record.title) || `${name}-${index + 1}`;

      return {
        ...build(record, ensureUniqueInSet(slugs, slugify(slugSource)), now),
        editorialStatus: "draft" as const,
        draftRevision: 1,
      };
    });

    await col.deleteMany({});
    await deleteCollectionPublications(name);
    if (docs.length) {
      await col.insertMany(docs as OptionalId<EditorialContentDocument>[]);
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
