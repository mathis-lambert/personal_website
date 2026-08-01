import {
  ObjectId,
  type Collection,
  type OptionalId,
} from "mongodb";

import {
  COLLECTION_NAMES,
  getContentPublicationsCollection,
  getEditorialContentCollection,
  type ContentPublicationDocument,
  type EditorialContentDocument,
} from "@/lib/db/collections";
import type { Note, Project } from "@/types/content";
import type {
  EditorialCollection,
  EditorialItem,
  EditorialPublicationSummary,
  EditorialSnapshot,
} from "@/types/editorial";

const INTERNAL_FIELDS = [
  "_id",
  "id",
  "createdAt",
  "updatedAt",
  "editorialStatus",
  "draftRevision",
  "publishedDraftRevision",
  "publishedVersion",
  "publishedAt",
  "hasUnpublishedChanges",
] as const;

export const withoutEditorialInternals = (value: Record<string, unknown>) => {
  const content = { ...value };
  for (const field of INTERNAL_FIELDS) delete content[field];
  return content;
};

const snapshotFromDocument = (
  document: EditorialContentDocument,
): EditorialSnapshot =>
  withoutEditorialInternals(document) as EditorialSnapshot;

export const serializeEditorialDocument = <T extends EditorialItem>(
  document: EditorialContentDocument | null | undefined,
): T | null => {
  if (!document) return null;
  const {
    _id,
    createdAt,
    updatedAt,
    publishedAt,
    ...content
  } = document;
  const editorialStatus = document.editorialStatus ?? "draft";
  const draftRevision = document.draftRevision ?? 1;
  const publishedDraftRevision = document.publishedDraftRevision;

  return {
    ...content,
    _id: _id ? String(_id) : "",
    editorialStatus,
    draftRevision,
    publishedDraftRevision,
    publishedVersion: document.publishedVersion,
    publishedAt: publishedAt?.toISOString(),
    hasUnpublishedChanges:
      editorialStatus === "published" &&
      publishedDraftRevision !== undefined &&
      draftRevision !== publishedDraftRevision,
    createdAt: createdAt?.toISOString(),
    updatedAt: updatedAt?.toISOString(),
  } as T;
};

const parseContentId = (value: string) => {
  if (!ObjectId.isValid(value)) throw new Error("Invalid item id");
  return new ObjectId(value);
};

type PublishedRow = {
  contentId: ObjectId;
  createdAt?: Date;
  publication: ContentPublicationDocument;
};

const currentPublicationPipeline = (
  collection: EditorialCollection,
  options: { contentId?: ObjectId; slug?: string } = {},
) => [
  {
    $match: {
      editorialStatus: "published",
      publishedVersion: { $type: "number" },
      ...(options.contentId ? { _id: options.contentId } : {}),
    },
  },
  {
    $lookup: {
      from: COLLECTION_NAMES.contentPublications,
      let: { contentId: "$_id", version: "$publishedVersion" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$contentId", "$$contentId"] },
                { $eq: ["$version", "$$version"] },
                { $eq: ["$collection", collection] },
              ],
            },
          },
        },
      ],
      as: "publication",
    },
  },
  { $unwind: "$publication" },
  ...(options.slug
    ? [{ $match: { "publication.snapshot.slug": options.slug } }]
    : []),
  {
    $project: {
      _id: 0,
      contentId: "$_id",
      createdAt: 1,
      publication: 1,
    },
  },
];

const serializePublishedRow = <T extends EditorialItem>(row: PublishedRow): T => ({
  ...row.publication.snapshot,
  _id: String(row.contentId),
  editorialStatus: "published",
  publishedVersion: row.publication.version,
  publishedDraftRevision: row.publication.sourceDraftRevision,
  publishedAt: row.publication.publishedAt.toISOString(),
  createdAt: row.createdAt?.toISOString(),
  updatedAt: row.publication.publishedAt.toISOString(),
} as T);

export async function getPublishedItems(
  collection: "projects",
): Promise<Project[]>;
export async function getPublishedItems(collection: "notes"): Promise<Note[]>;
export async function getPublishedItems(
  collection: EditorialCollection,
): Promise<EditorialItem[]> {
  const contents = await getEditorialContentCollection(collection);
  const rows = await contents
    .aggregate<PublishedRow>(currentPublicationPipeline(collection))
    .toArray();
  return rows
    .map((row) => serializePublishedRow(row))
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime() ||
        a.title.localeCompare(b.title),
    );
}

export async function getPublishedItem(
  collection: "projects",
  slug: string,
): Promise<Project | null>;
export async function getPublishedItem(
  collection: "notes",
  slug: string,
): Promise<Note | null>;
export async function getPublishedItem(
  collection: EditorialCollection,
  slug: string,
): Promise<EditorialItem | null> {
  const contents = await getEditorialContentCollection(collection);
  const contentId = ObjectId.isValid(slug) ? new ObjectId(slug) : undefined;
  const rows = await contents
    .aggregate<PublishedRow>(
      currentPublicationPipeline(collection, contentId ? { contentId } : { slug }),
    )
    .limit(1)
    .toArray();
  return rows[0] ? serializePublishedRow(rows[0]) : null;
}

export async function isPublishedSlugInUse(
  collection: EditorialCollection,
  slug: string,
  excludeContentId?: ObjectId,
) {
  const item =
    collection === "projects"
      ? await getPublishedItem("projects", slug)
      : await getPublishedItem("notes", slug);
  return !!item && (!excludeContentId || item._id !== String(excludeContentId));
}

const publicationSummary = (
  document: ContentPublicationDocument,
): EditorialPublicationSummary => {
  const snapshot = document.snapshot;
  const summary =
    "excerpt" in snapshot
      ? snapshot.excerpt
      : snapshot.subtitle ?? snapshot.description;
  return {
    _id: document._id ? String(document._id) : "",
    collection: document.collection,
    contentId: String(document.contentId),
    version: document.version,
    title: snapshot.title,
    summary,
    publishedAt: document.publishedAt.toISOString(),
    sourceDraftRevision: document.sourceDraftRevision,
    restoredFromVersion: document.restoredFromVersion,
  };
};

export async function listContentPublications(
  collection: EditorialCollection,
  itemId: string,
) {
  const contentId = parseContentId(itemId);
  const publications = await getContentPublicationsCollection();
  const documents = await publications
    .find({ collection, contentId })
    .sort({ version: -1 })
    .toArray();
  return documents.map(publicationSummary);
}

const nextPublicationVersion = async (
  collection: EditorialCollection,
  contentId: ObjectId,
) => {
  const publications = await getContentPublicationsCollection();
  const latest = await publications.findOne(
    { collection, contentId },
    { sort: { version: -1 }, projection: { version: 1 } },
  );
  return (latest?.version ?? 0) + 1;
};

const insertPublication = async (
  document: OptionalId<ContentPublicationDocument>,
): Promise<ContentPublicationDocument & { _id: ObjectId }> => {
  const publications = await getContentPublicationsCollection();
  const result = await publications.insertOne(document);
  return { ...document, _id: result.insertedId } as ContentPublicationDocument & {
    _id: ObjectId;
  };
};

const discardPublication = async (publicationId: ObjectId) => {
  const publications = await getContentPublicationsCollection();
  await publications.deleteOne({ _id: publicationId });
};

const assertPublicationSlugAvailable = async (
  collection: EditorialCollection,
  contents: Collection<EditorialContentDocument>,
  contentId: ObjectId,
  slug?: string,
) => {
  if (!slug) return;
  const [workingConflict, publishedConflict] = await Promise.all([
    contents.findOne(
      { _id: { $ne: contentId }, slug },
      { projection: { _id: 1 } },
    ),
    isPublishedSlugInUse(collection, slug, contentId),
  ]);
  if (workingConflict || publishedConflict) {
    throw new Error(`The slug "${slug}" is already in use`);
  }
};

export async function publishContentDraft(
  collection: EditorialCollection,
  itemId: string,
): Promise<{ item: EditorialItem; publication: EditorialPublicationSummary }> {
  const contentId = parseContentId(itemId);
  const contents = await getEditorialContentCollection(collection);
  const current = await contents.findOne({ _id: contentId });
  if (!current) throw new Error("Item not found");
  await assertPublicationSlugAvailable(
    collection,
    contents,
    contentId,
    current.slug,
  );

  const draftRevision = current.draftRevision ?? 1;
  const publishedAt = new Date();
  const publication = await insertPublication({
    collection,
    contentId,
    version: await nextPublicationVersion(collection, contentId),
    snapshot: snapshotFromDocument(current),
    sourceDraftRevision: draftRevision,
    publishedAt,
    createdAt: publishedAt,
  });

  const revisionFilter =
    current.draftRevision === undefined
      ? { draftRevision: { $exists: false } }
      : { draftRevision: current.draftRevision };
  try {
    const updated = await contents.findOneAndUpdate(
      { _id: contentId, ...revisionFilter },
      {
        $set: {
          editorialStatus: "published",
          draftRevision,
          publishedDraftRevision: draftRevision,
          publishedVersion: publication.version,
          publishedAt,
        },
      },
      { returnDocument: "after" },
    );
    if (!updated) {
      throw new Error(
        "The draft changed while it was being published. Try again.",
      );
    }

    return {
      item: serializeEditorialDocument(updated)!,
      publication: publicationSummary(publication),
    };
  } catch (error) {
    await discardPublication(publication._id);
    throw error;
  }
}

export async function rollbackContentPublication(
  collection: EditorialCollection,
  itemId: string,
  sourceVersion: number,
): Promise<{ item: EditorialItem; publication: EditorialPublicationSummary }> {
  const contentId = parseContentId(itemId);
  const contents = await getEditorialContentCollection(collection);
  const publications = await getContentPublicationsCollection();
  const [current, source] = await Promise.all([
    contents.findOne({ _id: contentId }),
    publications.findOne({ collection, contentId, version: sourceVersion }),
  ]);
  if (!current) throw new Error("Item not found");
  if (!source) throw new Error("Publication not found");
  await assertPublicationSlugAvailable(
    collection,
    contents,
    contentId,
    source.snapshot.slug,
  );

  const draftRevision = (current.draftRevision ?? 1) + 1;
  const publishedAt = new Date();
  const publication = await insertPublication({
    collection,
    contentId,
    version: await nextPublicationVersion(collection, contentId),
    snapshot: source.snapshot,
    sourceDraftRevision: draftRevision,
    restoredFromVersion: sourceVersion,
    publishedAt,
    createdAt: publishedAt,
  });

  const replacement = {
    ...source.snapshot,
    _id: contentId,
    editorialStatus: "published" as const,
    draftRevision,
    publishedDraftRevision: draftRevision,
    publishedVersion: publication.version,
    publishedAt,
    createdAt: current.createdAt ?? publishedAt,
    updatedAt: publishedAt,
  } as EditorialContentDocument;
  const revisionFilter =
    current.draftRevision === undefined
      ? { draftRevision: { $exists: false } }
      : { draftRevision: current.draftRevision };
  try {
    const result = await contents.replaceOne(
      { _id: contentId, ...revisionFilter },
      replacement,
    );
    if (result.modifiedCount !== 1) {
      throw new Error(
        "The draft changed while it was being restored. Try again.",
      );
    }

    return {
      item: serializeEditorialDocument(replacement)!,
      publication: publicationSummary(publication),
    };
  } catch (error) {
    await discardPublication(publication._id);
    throw error;
  }
}

export async function discardUnpublishedContentChanges(
  collection: EditorialCollection,
  itemId: string,
): Promise<EditorialItem> {
  const contentId = parseContentId(itemId);
  const contents = await getEditorialContentCollection(collection);
  const publications = await getContentPublicationsCollection();
  const current = await contents.findOne({ _id: contentId });
  if (!current) throw new Error("Item not found");
  if (
    current.editorialStatus !== "published" ||
    current.publishedVersion === undefined
  ) {
    throw new Error("This item has no live publication to restore");
  }

  const publication = await publications.findOne({
    collection,
    contentId,
    version: current.publishedVersion,
  });
  if (!publication) throw new Error("Live publication not found");
  await assertPublicationSlugAvailable(
    collection,
    contents,
    contentId,
    publication.snapshot.slug,
  );

  const draftRevision = (current.draftRevision ?? 1) + 1;
  const updatedAt = new Date();
  const replacement = {
    ...publication.snapshot,
    _id: contentId,
    editorialStatus: "published" as const,
    draftRevision,
    publishedDraftRevision: draftRevision,
    publishedVersion: publication.version,
    publishedAt: publication.publishedAt,
    createdAt: current.createdAt ?? publication.publishedAt,
    updatedAt,
  } as EditorialContentDocument;
  const revisionFilter =
    current.draftRevision === undefined
      ? { draftRevision: { $exists: false } }
      : { draftRevision: current.draftRevision };
  const result = await contents.replaceOne(
    { _id: contentId, ...revisionFilter },
    replacement,
  );
  if (result.modifiedCount !== 1) {
    throw new Error(
      "The draft changed while its edits were being discarded. Try again.",
    );
  }

  return serializeEditorialDocument(replacement)!;
}

export async function archivePublishedContent(
  collection: EditorialCollection,
  itemId: string,
) {
  const contentId = parseContentId(itemId);
  const contents = await getEditorialContentCollection(collection);
  const updated = await contents.findOneAndUpdate(
    { _id: contentId },
    { $set: { editorialStatus: "archived", updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!updated) throw new Error("Item not found");
  return serializeEditorialDocument(updated)!;
}

export async function deleteContentPublications(
  collection: EditorialCollection,
  contentId: ObjectId,
) {
  const publications = await getContentPublicationsCollection();
  await publications.deleteMany({ collection, contentId });
}

export async function deleteCollectionPublications(
  collection: EditorialCollection,
) {
  const publications = await getContentPublicationsCollection();
  await publications.deleteMany({ collection });
}
