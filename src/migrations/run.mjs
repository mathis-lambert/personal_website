/**
 * The migration runner.
 *
 *   npm run migrate:status    what has run, what hasn't
 *   npm run migrate           dry run: prints every change, writes nothing
 *   npm run migrate -- --apply
 *
 * Migrations are the `NNN-name.mjs` files next to this one, applied in filename
 * order, each recorded in the `_migrations` collection so it never runs twice.
 * A migration is a module exporting `description` and `up(db, ctx)`, where
 * `ctx.apply` is false during a dry run: every migration must read it and skip
 * its writes, because the dry run is the only review this gets before it touches
 * production.
 *
 * Nothing here runs automatically on deploy. That is deliberate. A collection
 * rename is not something a container restart should decide to do.
 */
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { LEDGER, connect } from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const APPLY = process.argv.includes("--apply");
const STATUS_ONLY = process.argv.includes("--status");

const loadMigrations = async () => {
  const files = (await readdir(HERE))
    .filter((name) => /^\d{3}-.*\.mjs$/.test(name))
    .sort();

  return Promise.all(
    files.map(async (file) => {
      const mod = await import(path.join(HERE, file));
      if (typeof mod.up !== "function") {
        throw new Error(`${file} does not export an up() function`);
      }
      return { id: file.replace(/\.mjs$/, ""), description: mod.description, up: mod.up };
    }),
  );
};

const { client, db, dbName, host } = await connect();

try {
  const migrations = await loadMigrations();
  const applied = new Map(
    (await db.collection(LEDGER).find().toArray()).map((doc) => [doc._id, doc]),
  );

  if (STATUS_ONLY) {
    console.log(`${dbName} at ${host}\n`);
    for (const migration of migrations) {
      const record = applied.get(migration.id);
      const when = record ? record.appliedAt.toISOString() : "pending";
      console.log(`  ${record ? "✓" : "·"} ${migration.id.padEnd(24)} ${when}`);
      if (!record) console.log(`      ${migration.description}`);
    }
    const pending = migrations.filter((m) => !applied.has(m.id)).length;
    console.log(`\n${migrations.length} migration(s), ${pending} pending`);
  } else {
    const pending = migrations.filter((migration) => !applied.has(migration.id));

    console.log(
      `${APPLY ? "Applying to" : "Dry run against"} ${dbName} at ${host}\n`,
    );

    if (pending.length === 0) {
      console.log("Nothing pending.");
    }

    for (const migration of pending) {
      console.log(`── ${migration.id}: ${migration.description}`);

      const log = (message) =>
        console.log(`   ${APPLY ? "•" : "would"} ${message}`);
      const note = (message) => console.log(`   ${message}`);

      const startedAt = Date.now();
      await migration.up(db, { apply: APPLY, log, note });

      if (APPLY) {
        await db.collection(LEDGER).insertOne({
          _id: migration.id,
          description: migration.description,
          appliedAt: new Date(),
          durationMs: Date.now() - startedAt,
        });
      }
      console.log("");
    }

    if (pending.length > 0) {
      console.log(
        APPLY
          ? `Applied ${pending.length} migration(s).`
          : `Nothing was written. Re-run with --apply to migrate.`,
      );
    }
  }
} finally {
  await client.close();
}
