/**
 * Separate the mutable editorial draft from the version served publicly.
 *
 * Existing public content is copied into `published` once. Future autosaves
 * update only the document root; an explicit publication replaces the snapshot.
 */
export const description =
  "Create immutable publication snapshots for existing projects and notes";

const snapshotFromDocument = (document) => {
  const snapshot = { ...document };
  for (const field of [
    "_id",
    "createdAt",
    "updatedAt",
    "editorialStatus",
    "draftRevision",
    "publishedRevision",
    "publishedAt",
    "published",
    "hasUnpublishedChanges",
  ]) {
    delete snapshot[field];
  }
  return snapshot;
};

const publicationDate = (document) => {
  if (document.publishedAt instanceof Date) return document.publishedAt;
  if (document.updatedAt instanceof Date) return document.updatedAt;
  const date = new Date(document.date);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export async function up(db, { apply, log, note }) {
  for (const name of ["projects", "notes"]) {
    const collection = db.collection(name);
    const documents = await collection.find().toArray();
    if (documents.length === 0) {
      note(`no ${name} to migrate`);
      continue;
    }

    const publicCount = documents.filter(
      (document) =>
        document.editorialStatus !== "draft" &&
        document.editorialStatus !== "archived",
    ).length;
    log(
      `initialize ${documents.length} ${name} (${publicCount} public snapshot${publicCount === 1 ? "" : "s"})`,
    );

    if (!apply) continue;

    await collection.bulkWrite(
      documents.map((document) => {
        const isPublic =
          document.editorialStatus !== "draft" &&
          document.editorialStatus !== "archived";
        const draftRevision = document.draftRevision ?? 1;
        const set = {
          editorialStatus: document.editorialStatus ?? "published",
          draftRevision,
        };

        if (isPublic) {
          set.editorialStatus = "published";
          set.published = document.published ?? snapshotFromDocument(document);
          set.publishedRevision = document.publishedRevision ?? draftRevision;
          set.publishedAt = publicationDate(document);
        }

        return {
          updateOne: {
            filter: { _id: document._id },
            update: { $set: set },
          },
        };
      }),
    );
  }
}
