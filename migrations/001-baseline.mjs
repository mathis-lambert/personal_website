/**
 * The starting point.
 *
 * On an empty database this loads the versioned content snapshot in
 * `migrations/baseline/`, which is what makes a fresh environment reproducible
 * without hand-copying documents out of production. On a database that already
 * has content, including production, it inspects and records, and writes nothing.
 *
 * The snapshot is a historical artefact: it is the shape the data had when
 * versioning started, `articles` collection and all. Later migrations move it
 * forward. Do not "fix" the baseline JSON to match today's schema, or the
 * migrations that follow will run against data they were never written for.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { CONTENT_COLLECTIONS } from "./lib.mjs";

export const description = "Load the versioned content baseline into an empty database";

const SNAPSHOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "baseline",
  "data.json",
);

/** Collection names as they existed in the baseline snapshot. */
const BASELINE_COLLECTIONS = ["projects", "articles", "experiences", "studies", "resume"];

export async function up(db, { apply, log, note }) {
  const counts = await Promise.all(
    [...new Set([...CONTENT_COLLECTIONS, ...BASELINE_COLLECTIONS])].map(
      async (name) => [name, await db.collection(name).countDocuments()],
    ),
  );

  const existing = counts.filter(([, count]) => count > 0);

  if (existing.length > 0) {
    note(
      `database already has content, recording the baseline without writing: ${existing
        .map(([name, count]) => `${name}=${count}`)
        .join(", ")}`,
    );
    return;
  }

  let snapshot;
  try {
    snapshot = JSON.parse(await readFile(SNAPSHOT, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      note(
        "no baseline/data.json in the repository, nothing to load. Export one with `npm run baseline:export`.",
      );
      return;
    }
    throw error;
  }

  for (const [name, documents] of Object.entries(snapshot.collections ?? {})) {
    if (!Array.isArray(documents) || documents.length === 0) continue;
    log(`insert ${documents.length} document(s) into \`${name}\``);
    if (apply) {
      await db.collection(name).insertMany(
        documents.map((doc) => ({
          ...doc,
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        })),
      );
    }
  }
}
