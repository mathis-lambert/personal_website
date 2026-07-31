import {
  ObjectId,
  type Collection,
  type Filter,
  type OptionalId,
} from "mongodb";

import {
  type NoteDocument,
  type NoteSnapshotDocument,
  type ProjectDocument,
  type ProjectSnapshotDocument,
  type ResumeDocument,
  type TimelineDocument,
  getNotesCollection,
  getExperiencesCollection,
  getProjectsCollection,
  getResumeCollection,
  getStudiesCollection,
} from "@/lib/db/collections";
import type {
  AdminCollectionName,
  AdminListCollectionName,
  Note,
  Project,
  ResumeData,
  TimelineEntry,
} from "@/types";

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

const EDITORIAL_INTERNAL_FIELDS = [
  "_id",
  "id",
  "createdAt",
  "updatedAt",
  "editorialStatus",
  "draftRevision",
  "publishedRevision",
  "publishedAt",
  "published",
  "hasUnpublishedChanges",
] as const;

const removeEditorialInternals = (value: Record<string, unknown>) => {
  for (const field of EDITORIAL_INTERNAL_FIELDS) delete value[field];
  return value;
};

const buildProjectDocument = (
  input: Project | Record<string, unknown>,
  slug: string,
  now: Date,
): OptionalId<ProjectDocument> => {
  const data = input as Partial<Project>;
  const { title, date, technologies, ...rest } = data;
  const cleanRest = removeEditorialInternals({
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
  const cleanRest = removeEditorialInternals({
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

/** The two slug-addressed document shapes, as one type for the shared paths. */
type ContentDocument = ProjectDocument | NoteDocument;
type ContentSnapshot = ProjectSnapshotDocument | NoteSnapshotDocument;

const snapshotFromDocument = (doc: ContentDocument): ContentSnapshot => {
  const {
    _id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    editorialStatus: _editorialStatus,
    draftRevision: _draftRevision,
    publishedRevision: _publishedRevision,
    publishedAt: _publishedAt,
    published: _published,
    hasUnpublishedChanges: _hasUnpublishedChanges,
    ...snapshot
  } = doc;
  void _id;
  void _createdAt;
  void _updatedAt;
  void _editorialStatus;
  void _draftRevision;
  void _publishedRevision;
  void _publishedAt;
  void _published;
  void _hasUnpublishedChanges;
  return snapshot as ContentSnapshot;
};

/**
 * A stored document as the API hands it out: Mongo's bookkeeping dropped and the
 * ObjectId flattened to a string.
 */
const stripContent = <T>(
  doc: ContentDocument | null | undefined,
): T | null => {
  if (!doc) return null;
  const {
    _id: mongoId,
    createdAt,
    updatedAt,
    publishedAt,
    published: _published,
    order: _order,
    ...rest
  } = doc;
  void _published;
  void _order;
  const editorialStatus = doc.editorialStatus ?? "published";
  const draftRevision = doc.draftRevision ?? 1;
  const publishedRevision =
    doc.publishedRevision ??
    (editorialStatus === "published" ? draftRevision : undefined);
  return {
    ...rest,
    _id: mongoId ? String(mongoId) : "",
    editorialStatus,
    draftRevision,
    publishedRevision,
    publishedAt: publishedAt?.toISOString(),
    hasUnpublishedChanges:
      editorialStatus === "published" &&
      publishedRevision !== undefined &&
      draftRevision !== publishedRevision,
    createdAt: createdAt?.toISOString(),
    updatedAt: updatedAt?.toISOString(),
  } as T;
};

const stripPublishedContent = <T>(doc: ContentDocument): T => {
  if (!doc.published) return stripContent<T>(doc)!;
  return {
    ...doc.published,
    _id: doc._id ? String(doc._id) : "",
    editorialStatus: "published",
    publishedAt: doc.publishedAt?.toISOString(),
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.publishedAt?.toISOString(),
  } as T;
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
            $and: [
              { _id: { $ne: excludeObjectId } },
              {
                $or: [
                  { slug: candidate },
                  { "published.slug": candidate },
                ],
              },
            ],
          } as unknown as Filter<T>)
        : ({
            $or: [{ slug: candidate }, { "published.slug": candidate }],
          } as unknown as Filter<T>);
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

const publicContentFilter = {
  editorialStatus: { $nin: ["draft", "archived"] },
} as const;

export async function getAllProjects(
  options: { includeUnpublished?: boolean } = {},
): Promise<Project[]> {
  const collection = await getProjectsCollection();
  const docs = await collection
    .find(options.includeUnpublished ? {} : publicContentFilter)
    .sort({ date: -1, title: 1 })
    .toArray();
  if (!docs.length) {
    console.info("No project entries found in the database.");
    return [];
  }
  const projects = docs.map((doc) =>
    options.includeUnpublished
      ? stripContent<Project>(doc)!
      : stripPublishedContent<Project>(doc),
  );
  return projects.sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime() ||
      a.title.localeCompare(b.title),
  );
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const collection = await getProjectsCollection();
  const objectId = parseObjectId(slug);
  const slugFilter = {
    $or: [
      { "published.slug": slug },
      { slug, published: { $exists: false } },
    ],
  };
  const doc = await collection.findOne(
    objectId
      ? { $and: [{ $or: [{ _id: objectId }, slugFilter] }, publicContentFilter] }
      : { $and: [slugFilter, publicContentFilter] },
  );
  if (!doc) {
    console.info("No project entry found for the requested slug or id.");
    return null;
  }
  return stripPublishedContent<Project>(doc);
}

export async function getAllNotes(
  options: { includeUnpublished?: boolean } = {},
): Promise<Note[]> {
  const collection = await getNotesCollection();
  const docs = await collection
    .find(options.includeUnpublished ? {} : publicContentFilter)
    .sort({ date: -1, title: 1 })
    .toArray();
  if (!docs.length) {
    console.info("No note entries found in the database.");
    return [];
  }
  const notes = docs.map((doc) =>
    options.includeUnpublished
      ? stripContent<Note>(doc)!
      : stripPublishedContent<Note>(doc),
  );
  return notes.sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime() ||
      a.title.localeCompare(b.title),
  );
}

export async function getNoteBySlug(slug: string): Promise<Note | null> {
  const collection = await getNotesCollection();
  const objectId = parseObjectId(slug);
  const slugFilter = {
    $or: [
      { "published.slug": slug },
      { slug, published: { $exists: false } },
    ],
  };
  const doc = await collection.findOne(
    objectId
      ? { $and: [{ $or: [{ _id: objectId }, slugFilter] }, publicContentFilter] }
      : { $and: [slugFilter, publicContentFilter] },
  );
  if (!doc) {
    console.info("No note entry found for the requested slug or id.");
    return null;
  }
  return stripPublishedContent<Note>(doc);
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
    getCollection: getProjectsCollection,
    build: buildProjectDocument,
    fallbackSlug: "project",
  },
  notes: {
    getCollection: getNotesCollection,
    build: buildNoteDocument,
    fallbackSlug: "note",
  },
} as const;

type SlugCollectionName = keyof typeof slugCollections;

const isSlugCollection = (name: string): name is SlugCollectionName =>
  name in slugCollections;

/**
 * The driver types each collection separately and there is no useful supertype
 * of `Collection<ProjectDocument>` and `Collection<NoteDocument>`, so the shared
 * code works against the document union. This is the only cast, and it is here
 * rather than at each of the eight call sites it replaces.
 */
const openSlugCollection = async (name: SlugCollectionName) =>
  (await slugCollections[name].getCollection()) as unknown as Collection<
    ContentDocument
  >;

export async function createProjectOrNote(
  collection: SlugCollectionName,
  item: Record<string, unknown>,
): Promise<{ _id: string; item: Project | Note }> {
  const { build, fallbackSlug } = slugCollections[collection];
  const col = await openSlugCollection(collection);

  const slug = await ensureUniqueSlugDb(
    col,
    slugify(asString(item.slug) || asString(item.title) || fallbackSlug),
  );
  const doc = build(item, slug, new Date());
  const draftDoc = {
    ...doc,
    editorialStatus: "draft" as const,
    draftRevision: 1,
  } as OptionalId<ContentDocument>;
  const result = await col.insertOne(draftDoc);

  return {
    _id: String(result.insertedId),
    item: stripContent<Project | Note>({
      ...draftDoc,
      _id: result.insertedId,
    } as ContentDocument)!,
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

    const safePatch = removeEditorialInternals({ ...patch });
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

export async function publishContentItem(
  collection: SlugCollectionName,
  itemId: string,
): Promise<Project | Note> {
  const col = await openSlugCollection(collection);
  const objectId = parseObjectId(itemId);
  if (!objectId) throw new Error("Invalid item id");

  const current = await col.findOne({ _id: objectId });
  if (!current) throw new Error("Item not found");

  const draftRevision = current.draftRevision ?? 1;
  const publishedAt = new Date();
  const publication: Record<string, unknown> = {
    published: snapshotFromDocument(current),
    editorialStatus: "published",
    draftRevision,
    publishedRevision: draftRevision,
    publishedAt,
  };
  const revisionFilter =
    current.draftRevision === undefined
      ? { draftRevision: { $exists: false } }
      : { draftRevision: current.draftRevision };
  const updated = await col.findOneAndUpdate(
    { _id: objectId, ...revisionFilter },
    { $set: publication },
    { returnDocument: "after" },
  );
  if (!updated) {
    throw new Error("The draft changed while it was being published. Try again.");
  }
  return stripContent<Project | Note>(updated)!;
}

export async function archiveContentItem(
  collection: SlugCollectionName,
  itemId: string,
): Promise<Project | Note> {
  const col = await openSlugCollection(collection);
  const objectId = parseObjectId(itemId);
  if (!objectId) throw new Error("Invalid item id");

  const updated = await col.findOneAndUpdate(
    { _id: objectId },
    { $set: { editorialStatus: "archived", updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!updated) throw new Error("Item not found");
  return stripContent<Project | Note>(updated)!;
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

      return build(record, ensureUniqueInSet(slugs, slugify(slugSource)), now);
    });

    await col.deleteMany({});
    if (docs.length) {
      await col.insertMany(docs as OptionalId<ContentDocument>[]);
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
