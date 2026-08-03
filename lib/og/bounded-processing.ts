export function createConcurrencyLimiter(maxConcurrent: number) {
  let active = 0;
  const waiting: Array<() => void> = [];

  const acquire = async () => {
    if (active < maxConcurrent) {
      active += 1;
      return;
    }
    await new Promise<void>((resolve) => waiting.push(resolve));
  };

  const release = () => {
    const next = waiting.shift();
    if (next) next();
    else active -= 1;
  };

  return async <T>(work: () => Promise<T>): Promise<T> => {
    await acquire();
    try {
      return await work();
    } finally {
      release();
    }
  };
}

export async function readBoundedResponse(
  response: Response,
  maxBytes: number,
): Promise<Buffer> {
  const declaredSize = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > maxBytes) {
    throw new RangeError("Response exceeds byte limit");
  }
  if (!response.body) return Buffer.alloc(0);

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("Response exceeds byte limit");
        throw new RangeError("Response exceeds byte limit");
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, total);
}
