# Migrations

Versioned, ordered changes to the database. Separate from `scripts/`, which holds
development tooling that can be run any number of times without consequence.

```
migrations/
  run.mjs              the runner
  lib.mjs              connection + shared helpers
  001-baseline.mjs      loads the versioned snapshot into an empty database
  002-notes-rename.mjs  articles -> notes
  baseline/
    data.json          every content document, _id stripped
    schema.json        every field path, its types, how many documents have it
```

## Running locally

```bash
npm run migrate:status          # what has run, what hasn't
npm run migrate                 # dry run: prints every change, writes nothing
npm run migrate -- --apply      # writes
```

This reads `.env`, so it only ever reaches whatever `MONGODB_URI` points at —
usually the local dev database.

## Running against production

Production Mongo has no port open to the internet; it is only reachable from
containers already on the server's `databases` Docker network. Nothing else can
reach it, including a GitHub-hosted Actions runner, which is why this can't be
"just" an `npm run migrate` step in the deploy job.

**Actions → Migrate → Run workflow** builds a `migrator` image (the `migrator`
target in `Dockerfile`: full source, no built app) and runs it as a one-off
container on the server, on that network. Choose an action from the dropdown:

- `status` — what has run, what hasn't.
- `dry-run` (default) — every pending change, written nowhere.
- `apply` — writes.

Read the dry-run output in the workflow log before ever choosing `apply`.

Nothing runs automatically on deploy or on a tag push, and this workflow does
not change that — `workflow_dispatch` only fires when someone deliberately runs
it. A collection rename is not a decision a container restart, or a release
tag, should make.

Take a dump before `apply`, from the server, since that is the only place with
a route to Mongo:

```bash
mongodump --uri="$MONGODB_URI" --out "dump-$(date +%F)"
```

## The ledger

Each applied migration is recorded in the `_migrations` collection by filename,
so it never runs twice. `npm run migrate:status` reads it. To force a re-run,
delete that one document.

## Writing one

Name it `NNN-short-name.mjs` and export two things:

```js
export const description = "One line, shown by the runner";

export async function up(db, { apply, log, note }) {
  const count = await db.collection("things").countDocuments({ stale: true });
  log(`update ${count} thing(s)`);        // prefixed "would" during a dry run
  if (apply) await db.collection("things").updateMany(/* ... */);
}
```

Every migration **must** check `apply` before writing. The dry run is the only
review a migration gets before it touches production, so a migration that writes
regardless makes that review a lie.

There is no `down()`. Reversing a destructive change with a script that has never
been tested is worse than restoring the dump.

## The baseline

`baseline/data.json` is a historical artefact: the shape the data had when
versioning started, `articles` collection and all. `001-baseline` loads it into an
empty database, then later migrations move it forward, which is the same path
production took.

Do not edit it to match today's schema. The migrations that follow were written
against the old shape, and a "tidied up" baseline is a baseline they no longer
apply to.

Refresh it from production with:

```bash
MONGODB_URI="$PROD_URI" MONGODB_DB=... node scripts/export-baseline.mjs
```

When the database is only reachable from the server, dump it there and derive the
schema locally from the dump. Two things that waste an evening if you get them
wrong: mongosh has no `--database` flag, the database is a positional argument;
and `docker exec -it` allocates a pseudo-TTY that puts carriage returns through
the redirect, so use `-i` alone.

```bash
read -rs MONGO_PW
docker exec -i $(docker ps -q -f name=mongodb) mongosh personal_website \
  --username root --password "$MONGO_PW" --authenticationDatabase admin --quiet \
  --eval 'const o={};for(const n of ["projects","notes","experiences","studies","resume"]){if(db.getCollectionNames().includes(n))o[n]=db.getCollection(n).find({},{_id:0}).toArray()};print(JSON.stringify({source:db.getName(),collections:o},null,2))' \
  > dump.json

node scripts/export-baseline.mjs --from dump.json
```

`JSON.stringify` rather than `EJSON.stringify`: EJSON wraps dates as
`{"$date": ...}`, which `001-baseline` does not know how to read back.

`schema.json` is the file worth reading in a diff. It shows when a field quietly
changed type, appeared, or stopped being written.

Telemetry collections (`api_request_logs`, `ui_events`,
`chat_conversation_turns`) are never exported. They are large and they hold hashed
IPs, user agents and whatever visitors typed into the chat.
