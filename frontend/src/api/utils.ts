import { getAuthHeaders } from './auth';

export type FetchWithTimeoutInit = RequestInit & { timeoutMs?: number; authToken?: string };

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
    else parentSignal.addEventListener('abort', onParentAbort);
  }

  const timeoutId = setTimeout(() => {
    try {
      controller.abort(new DOMException('Timeout', 'AbortError'));
    } catch {
      controller.abort();
    }
  }, timeoutMs);

  try {
    const { timeoutMs: _ignoredTimeout, signal: _ignoredSignal, headers, authToken, ...rest } =
      init ?? {};
    void _ignoredTimeout;
    void _ignoredSignal;
    const mergedHeaders: HeadersInit = { ...(headers || {}), ...getAuthHeaders(authToken) };
    return await fetch(input, {
      ...(rest as RequestInit),
      headers: mergedHeaders,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
    if (parentSignal) parentSignal.removeEventListener('abort', onParentAbort);
  }
}

export function sanitizeUrl(url?: string): string | undefined {
  if (!url) return url;
  return url.replace(/:\s*\/\//, '://');
}
