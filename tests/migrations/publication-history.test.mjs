import assert from "node:assert/strict";
import test from "node:test";

import { up } from "../../migrations/005-publication-history.mjs";

const snapshotMigrationId = "004-editorial-publication-snapshots";

const createDb = ({ documents = [], missingSnapshot = 0 } = {}) => {
  const filters = [];
  const contentCollection = {
    find(filter) {
      filters.push(filter);
      return { toArray: async () => documents };
    },
    countDocuments: async () => missingSnapshot,
    indexes: async () => [],
  };
  const publications = { createIndex: async () => undefined };

  return {
    filters,
    db: {
      collection(name) {
        return name === "content_publications"
          ? publications
          : contentCollection;
      },
    },
  };
};

test("dry-run previews snapshots created by migration 004", async () => {
  const { db, filters } = createDb({
    documents: [{ editorialStatus: "published" }],
    missingSnapshot: 1,
  });
  const messages = [];

  await up(db, {
    apply: false,
    log: (message) => messages.push(message),
    note: (message) => messages.push(message),
    pendingMigrationIds: [snapshotMigrationId, "005-publication-history"],
  });

  assert.deepEqual(filters[0], {
    $or: [
      { published: { $exists: true } },
      { editorialStatus: { $nin: ["draft", "archived"] } },
    ],
  });
  assert.equal(
    messages.filter((message) => message.includes("snapshot into")).length,
    2,
  );
});

test("dry-run still rejects missing snapshots after migration 004", async () => {
  const { db } = createDb({ missingSnapshot: 1 });

  await assert.rejects(
    up(db, {
      apply: false,
      log: () => undefined,
      note: () => undefined,
      pendingMigrationIds: ["005-publication-history"],
    }),
    /published projects have no snapshot to migrate/,
  );
});
