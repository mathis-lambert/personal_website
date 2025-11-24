export type UnauthorizedHandler = () => Promise<void> | void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let unauthorizedInFlight: Promise<void> | null = null;
let lastUnauthorizedAt = 0;
const UNAUTHORIZED_THROTTLE_MS = 2000;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export type FetchWithTimeoutInit = RequestInit & {
  timeoutMs?: number;
  authToken?: string;
};

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: FetchWithTimeoutInit,
): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? 10000;
  const parentSignal = init?.signal;
  const controller = new AbortController();

  const onParentAbort = () => controller.abort();
  if (parentSignal) {
    if (parentSignal.aborted) onParentAbort();
    else parentSignal.addEventListener("abort", onParentAbort);
  }

  const timeoutId = setTimeout(() => {
    try {
      controller.abort(new DOMException("Timeout", "AbortError"));
    } catch {
      controller.abort();
    }
  }, timeoutMs);

  const normalizeHeaders = (h?: HeadersInit): Record<string, string> => {
    const out: Record<string, string> = {};
    if (!h) return out;
    if (h instanceof Headers) {
      h.forEach((v, k) => {
        out[k] = v;
      });
      return out;
    }
    if (Array.isArray(h)) {
      for (const [k, v] of h) out[k] = v;
      return out;
    }
    return { ...(h as Record<string, string>) };
  };

  const buildHeaders = (
    headers?: HeadersInit,
    authToken?: string,
    method?: string,
  ): HeadersInit => {
    const base = normalizeHeaders(headers);
    const merged: Record<string, string> = { ...base };
    if (authToken) {
      merged.Authorization = `Bearer ${authToken}`;
    }
    const m = (method ?? "GET").toUpperCase();
    return merged;
  };

  const triggerUnauthorized = async (): Promise<void> => {
    // Coalesce concurrent unauthorized handling and throttle attempts
    if (unauthorizedInFlight) return unauthorizedInFlight;
    if (!unauthorizedHandler) return; // Nothing to do
    const now = Date.now();
    if (now - lastUnauthorizedAt < UNAUTHORIZED_THROTTLE_MS) return;
    lastUnauthorizedAt = now;
    const p = Promise.resolve()
      .then(() => unauthorizedHandler?.())
      .then(() => undefined);
    unauthorizedInFlight = p.finally(() => {
      unauthorizedInFlight = null;
    });
    return unauthorizedInFlight;
  };

  try {
    const {
      timeoutMs: _ignoredTimeout,
      signal: _ignoredSignal,
      headers,
      authToken,
      ...rest
    } = init ?? {};
    void _ignoredTimeout;
    void _ignoredSignal;
    const method = (rest.method ?? "GET").toUpperCase();

    const doFetch = async (): Promise<Response> =>
      await fetch(input, {
        ...(rest as RequestInit),
        headers: buildHeaders(headers, authToken, method),
        signal: controller.signal,
        credentials: "include",
      });

    // First attempt
    const res = await doFetch();
    if (res.status !== 401 || authToken) return res;

    // 401 without bearer token: try to re-establish session via handler, then retry once
    await triggerUnauthorized();
    return await doFetch();
  } finally {
    clearTimeout(timeoutId);
    if (parentSignal) parentSignal.removeEventListener("abort", onParentAbort);
  }
}

export function sanitizeUrl(url?: string): string | undefined {
  if (!url) return url;
  return url.replace(/:\s*\/\//, "://");
}
