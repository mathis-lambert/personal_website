import assert from "node:assert/strict";
import test from "node:test";

import {
  createConcurrencyLimiter,
  readBoundedResponse,
} from "../../lib/og/bounded-processing.ts";

test("response reading aborts once the streaming byte limit is exceeded", async () => {
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array(6));
      controller.enqueue(new Uint8Array(6));
    },
    cancel() {
      cancelled = true;
    },
  });

  await assert.rejects(
    readBoundedResponse(new Response(body), 10),
    /exceeds byte limit/,
  );
  assert.equal(cancelled, true);
});

test("concurrency limiter never starts more than two jobs", async () => {
  const limit = createConcurrencyLimiter(2);
  let active = 0;
  let peak = 0;
  const jobs = Array.from({ length: 8 }, () =>
    limit(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
    }),
  );

  await Promise.all(jobs);
  assert.equal(peak, 2);
});
