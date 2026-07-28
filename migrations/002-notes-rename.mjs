/**
 * The blog became Notes.
 *
 * That moved the route from /blog to /notes, the collection from `articles` to
 * `notes`, the image folder from /images/blog to /images/notes, and the two
 * analytics events from article_open/article_share to note_open/note_share.
 * This brings an existing database in line with all of it.
 *
 * Take a dump before applying this to production (`mongodump`). A collection
 * rename is not something you undo with a second migration.
 *
 * Message bodies in `chat_conversation_turns` are deliberately left alone. They
 * are a record of what was actually said, /blog links and all; rewriting them
 * would falsify the transcript. Only the structural `path` and `location` fields
 * that the app writes itself are updated.
 */
import { replaceInField } from "./lib.mjs";

export const description = "Rename `articles` to `notes` and rewrite /blog references";

const renameCollection = async (db, { apply, log, note }) => {
  const names = (
    await db.listCollections({}, { nameOnly: true }).toArray()
  ).map((entry) => entry.name);

  const hasArticles = names.includes("articles");
  const hasNotes = names.includes("notes");

  if (!hasArticles) {
    const count = hasNotes ? await db.collection("notes").countDocuments() : 0;
    note(
      hasNotes
        ? `no \`articles\` collection, \`notes\` already exists with ${count} document(s)`
        : "no \`articles\` collection and no \`notes\` collection, nothing to rename",
    );
    return;
  }

  const articleCount = await db.collection("articles").countDocuments();

  if (hasNotes) {
    const noteCount = await db.collection("notes").countDocuments();
    if (noteCount > 0) {
      throw new Error(
        `both \`articles\` (${articleCount}) and a non-empty \`notes\` (${noteCount}) exist. ` +
          "Refusing to guess which is authoritative. Inspect them and merge by hand.",
      );
    }
    log("drop the empty `notes` collection so the rename can land");
    if (apply) await db.collection("notes").drop();
  }

  log(`rename \`articles\` to \`notes\` (${articleCount} document(s))`);
  if (apply) await db.collection("articles").rename("notes");
};

const rewriteNoteDocuments = async (db, { apply, log, note }) => {
  /**
   * During a dry run the rename above has not happened, so the documents are
   * still in `articles` and counting them in `notes` would report zero of
   * everything. Read from wherever they actually are; write only to `notes`,
   * which is where they will be by the time `apply` is true.
   */
  const source = apply
    ? db.collection("notes")
    : (await db.collection("articles").countDocuments()) > 0
      ? db.collection("articles")
      : db.collection("notes");
  const notes = db.collection("notes");

  const withBlogImages = await source.countDocuments({
    $or: [
      { "media.thumbnailUrl": /\/images\/blog\// },
      { "media.imageUrl": /\/images\/blog\// },
      { "media.gallery": /\/images\/blog\// },
      { content: /\/images\/blog\// },
    ],
  });

  if (withBlogImages === 0) {
    note("no /images/blog/ references in notes");
  } else {
    log(`rewrite /images/blog/ to /images/notes/ in ${withBlogImages} note(s)`);
    if (apply) {
      await notes.updateMany({}, [
        {
          $set: {
            ...replaceInField("content", "/images/blog/", "/images/notes/"),
            ...replaceInField(
              "media.thumbnailUrl",
              "/images/blog/",
              "/images/notes/",
            ),
            ...replaceInField(
              "media.imageUrl",
              "/images/blog/",
              "/images/notes/",
            ),
            "media.gallery": {
              $cond: [
                { $isArray: "$media.gallery" },
                {
                  $map: {
                    input: "$media.gallery",
                    as: "url",
                    in: {
                      $replaceAll: {
                        input: "$$url",
                        find: "/images/blog/",
                        replacement: "/images/notes/",
                      },
                    },
                  },
                },
                "$media.gallery",
              ],
            },
          },
        },
      ]);
    }
  }

  /**
   * Self-referential links.
   *
   * A note can carry `links.canonical` pointing at its own URL on this site,
   * which is still spelled /blog. Only site-relative values are rewritten, and
   * only via a filter, for a reason worth stating: note bodies cite
   * `blogs.nvidia.com/blog/…` and `blog.langchain.com/…`, so a blanket
   * find-and-replace of "/blog" across the document would quietly break
   * somebody else's URLs. That is why `content` is left alone here and only the
   * image prefix above is rewritten inside it.
   */
  for (const field of ["links.canonical", "links.discussion"]) {
    const filter = { [field]: /^\/blog(\/|$)/ };
    const count = await source.countDocuments(filter);
    if (count === 0) continue;

    log(`rewrite ${field} from /blog to /notes on ${count} note(s)`);
    if (apply) {
      await notes.updateMany(filter, [
        {
          $set: {
            [field]: {
              $replaceOne: {
                input: `$${field}`,
                find: "/blog",
                replacement: "/notes",
              },
            },
          },
        },
      ]);
    }
  }

  // Development fixtures only. A no-op on production, where they never existed.
  const seeded = await source.countDocuments({ seedKey: /^dev-article-/ });
  if (seeded > 0) {
    log(`rewrite ${seeded} dev seedKey(s) from dev-article-* to dev-note-*`);
    if (apply) {
      await notes.updateMany({ seedKey: /^dev-article-/ }, [
        { $set: replaceInField("seedKey", "dev-article-", "dev-note-") },
      ]);
    }
  }
};

const rewriteTelemetry = async (db, { apply, log }) => {
  const events = db.collection("ui_events");

  for (const [from, to] of [
    ["article_open", "note_open"],
    ["article_share", "note_share"],
  ]) {
    const count = await events.countDocuments({ name: from });
    if (count === 0) continue;
    log(`rename ${count} ui_event(s) from ${from} to ${to}`);
    if (apply) await events.updateMany({ name: from }, { $set: { name: to } });
  }

  const eventPaths = await events.countDocuments({ path: /^\/blog(\/|$)/ });
  if (eventPaths > 0) {
    log(`rewrite /blog paths on ${eventPaths} ui_event(s)`);
    if (apply) {
      await events.updateMany({ path: /^\/blog(\/|$)/ }, [
        { $set: replaceInField("path", "/blog", "/notes") },
      ]);
    }
  }

  const logs = db.collection("api_request_logs");
  const logHits = await logs.countDocuments({
    $or: [
      { path: /\/blog(\/|$)/ },
      { route: /\/blog(\/|$)/ },
      { path: /\/admin\/articles(\/|$)/ },
      { route: /\/admin\/articles(\/|$)/ },
    ],
  });
  if (logHits > 0) {
    log(`rewrite /blog and /admin/articles on ${logHits} request log(s)`);
    if (apply) {
      await logs.updateMany({}, [
        {
          $set: {
            ...replaceInField("path", "/admin/articles", "/admin/notes"),
            ...replaceInField("route", "/admin/articles", "/admin/notes"),
          },
        },
        {
          $set: {
            ...replaceInField("path", "/blog", "/notes"),
            ...replaceInField("route", "/blog", "/notes"),
          },
        },
      ]);
    }
  }

  const turns = db.collection("chat_conversation_turns");
  const turnHits = await turns.countDocuments({
    $or: [{ path: /\/blog(\/|$)/ }, { location: /\/blog(\/|$)/ }],
  });
  if (turnHits > 0) {
    log(
      `rewrite /blog paths on ${turnHits} chat turn(s), message bodies untouched`,
    );
    if (apply) {
      await turns.updateMany({}, [
        {
          $set: {
            ...replaceInField("path", "/blog", "/notes"),
            ...replaceInField("location", "/blog", "/notes"),
          },
        },
      ]);
    }
  }
};

export async function up(db, ctx) {
  await renameCollection(db, ctx);
  await rewriteNoteDocuments(db, ctx);
  await rewriteTelemetry(db, ctx);
}
