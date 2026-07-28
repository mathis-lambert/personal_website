export type FetchWithTimeoutInit = RequestInit & {
  timeoutMs?: number;
  authToken?: string;
};

const normalizeHeaders = (headers?: HeadersInit): Record<string, string> => {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return { ...headers };
};

/**
 * `fetch` that gives up: a timeout that also honours the caller's own `signal`,
 * plus optional bearer auth.
 *
 * The module-level "unauthorized handler" that used to retry 401s is gone.
 * Nothing ever registered one, so it only ever fired the same failing request a
 * second time.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: FetchWithTimeoutInit,
): Promise<Response> {
  const { timeoutMs = 10_000, signal, headers, authToken, ...rest } = init ?? {};

  const controller = new AbortController();
  const onParentAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) onParentAbort();
    else signal.addEventListener("abort", onParentAbort);
  }

  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException("Timeout", "AbortError"));
  }, timeoutMs);

  try {
    const merged = normalizeHeaders(headers);
    if (authToken) merged.Authorization = `Bearer ${authToken}`;

    return await fetch(input, {
      ...rest,
      headers: merged,
      signal: controller.signal,
      credentials: "include",
    });
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener("abort", onParentAbort);
  }
}
