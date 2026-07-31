/**
 * Move the single embedded publication snapshot into an append-only history.
 *
 * The content document remains the mutable working draft and stores only the
 * version number currently served. Every publication lives in
 * `content_publications` and is never updated after insertion.
 */
export const description =
  "Move embedded snapshots into immutable publication history";

const embeddedPublicationIndex = "published.slug_1";

export async function up(db, { apply, log, note }) {
  const publications = db.collection("content_publications");

  for (const collectionName of ["projects", "notes"]) {
    const contents = db.collection(collectionName);
    const documents = await contents.find({ published: { $exists: true } }).toArray();
    const missingSnapshot = await contents.countDocuments({
      editorialStatus: "published",
      published: { $exists: false },
      publishedVersion: { $exists: false },
    });
    if (missingSnapshot > 0) {
      throw new Error(
        `${missingSnapshot} published ${collectionName} have no snapshot to migrate`,
      );
    }

    if (documents.length === 0) {
      note(`no embedded ${collectionName} snapshots to move`);
    } else {
      log(
        `move ${documents.length} ${collectionName} snapshot${documents.length === 1 ? "" : "s"} into content_publications`,
      );
    }

    if (apply) {
      for (const document of documents) {
        const version = document.publishedVersion ?? 1;
        const sourceDraftRevision =
          document.publishedRevision ?? document.draftRevision ?? 1;
        const publishedAt =
          document.publishedAt instanceof Date
            ? document.publishedAt
            : document.updatedAt instanceof Date
              ? document.updatedAt
              : new Date();

        await publications.updateOne(
          { collection: collectionName, contentId: document._id, version },
          {
            $setOnInsert: {
              collection: collectionName,
              contentId: document._id,
              version,
              snapshot: document.published,
              sourceDraftRevision,
              publishedAt,
              createdAt: publishedAt,
            },
          },
          { upsert: true },
        );

        await contents.updateOne(
          { _id: document._id },
          {
            $set: {
              publishedVersion: version,
              publishedDraftRevision: sourceDraftRevision,
            },
            $unset: { published: "", publishedRevision: "" },
          },
        );
      }

      const indexes = await contents.indexes();
      if (indexes.some((index) => index.name === embeddedPublicationIndex)) {
        await contents.dropIndex(embeddedPublicationIndex);
      }
    }
  }

  if (apply) {
    await publications.createIndex(
      { collection: 1, contentId: 1, version: 1 },
      { unique: true },
    );
    await publications.createIndex({
      collection: 1,
      contentId: 1,
      publishedAt: -1,
    });
    await publications.createIndex({ collection: 1, "snapshot.slug": 1 });
  }
}
