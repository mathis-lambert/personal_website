import { MongoClient } from "mongodb";

/** Collections that hold authored content, and nothing else. */
export const CONTENT_COLLECTIONS = [
  "projects",
  "notes",
  "experiences",
  "studies",
  "resume",
];

/**
 * Collections deliberately excluded from every export.
 *
 * They are telemetry, not content: request logs, UI events and chat transcripts.
 * They are large, they carry hashed IPs, user agents and whatever visitors typed
 * into the chat, and none of it belongs in a git repository.
 */
export const EXCLUDED_COLLECTIONS = [
  "api_request_logs",
  "ui_events",
  "chat_conversation_turns",
];

/** The ledger. One document per migration that has run. */
export const LEDGER = "_migrations";

export const connect = async () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE;

  if (!uri || !dbName) {
    throw new Error("MONGODB_URI and MONGODB_DB must both be set.");
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
  await client.connect();
  return { client, db: client.db(dbName), dbName, host: new URL(uri).host };
};

/**
 * Mongo 4.2+ pipeline update: rewrite a substring in a field, but only where the
 * field actually holds a string. Without the type guard a pipeline `$replaceAll`
 * throws on every document where the field is missing.
 */
export const replaceInField = (field, find, replacement) => ({
  [field]: {
    $cond: [
      { $eq: [{ $type: `$${field}` }, "string"] },
      { $replaceAll: { input: `$${field}`, find, replacement } },
      `$${field}`,
    ],
  },
});
