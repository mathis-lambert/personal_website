/**
 * Existing experiences and studies predate the admin visibility control.
 *
 * Missing `hide` means visible at runtime, but making that default explicit in
 * the database gives every record the same shape and keeps future tooling
 * predictable. Existing explicit values are deliberately preserved.
 */
export const description = "Initialize missing timeline visibility flags";

export async function up(db, { apply, log, note }) {
  for (const name of ["experiences", "studies"]) {
    const collection = db.collection(name);
    const count = await collection.countDocuments({ hide: { $exists: false } });

    if (count === 0) {
      note("all " + name + " already have a `hide` flag");
      continue;
    }

    log("set `hide: false` on " + count + " " + name + " without the flag");
    if (apply) {
      await collection.updateMany(
        { hide: { $exists: false } },
        { $set: { hide: false } },
      );
    }
  }
}
