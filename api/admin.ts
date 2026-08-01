import { fetchWithTimeout } from "@/api/utils";
import type {
  AdminConversationDetailResponse,
  AdminConversationsListResponse,
  AdminConversationTurnsResponse,
} from "@/types/conversations";
import type {
  AdminCollectionName,
  AdminUpdateResumeInput,
} from "@/types/admin";
import type {
  AdminInsights,
  ContentAnalyticsKind,
  ContentInsights,
} from "@/types/analytics";
import type { ResumeData } from "@/types/resume";

/** Options every read shares: who is asking, and how to cancel. */
export type ReadOptions = { token?: string; signal?: AbortSignal };

/**
 * One GET, one error message, one place to add a header.
 *
 * Ten read functions each opened their own `fetchWithTimeout`, checked `res.ok`,
 * threw a message built the same way and cast the body. None of them accepted an
 * `AbortSignal`, so a screen that changed its filters twice in a second had two
 * responses racing to set the same state.
 */
const readJson = async <T>(
  url: string,
  what: string,
  { token, signal }: ReadOptions = {},
  timeoutMs = 12_000,
): Promise<T> => {
  const res = await fetchWithTimeout(url, { timeoutMs, authToken: token, signal });
  if (!res.ok) throw new Error(`Failed to fetch ${what}: ${res.status}`);
  return (await res.json()) as T;
};

/** Append a query string only when there is one. */
const withQuery = (path: string, qs: URLSearchParams) =>
  qs.size ? `${path}?${qs}` : path;

export async function getCollectionData<T = unknown>(
  collection: AdminCollectionName,
  options?: ReadOptions,
): Promise<T> {
  const body = await readJson<{ data?: T }>(
    `/api/admin/data/${collection}`,
    collection,
    options,
    10_000,
  );
  return body?.data as T;
}

export async function replaceCollection(
  collection: AdminCollectionName,
  data: unknown,
  token?: string,
) {
  const res = await fetchWithTimeout(`/api/admin/data/${collection}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    timeoutMs: 12000,
    authToken: token,
  });
  if (!res.ok)
    throw new Error(`Failed to replace ${collection}: ${res.status}`);
}

export async function updateItem(
  collection: "resume",
  id: string,
  patch: AdminUpdateResumeInput,
  token?: string,
): Promise<{ ok: boolean; item: ResumeData }> {
  const res = await fetchWithTimeout("/api/admin/resume", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
    timeoutMs: 10000,
    authToken: token,
  });
  if (!res.ok)
    throw new Error(`Failed to update ${collection}#${id}: ${res.status}`);
  return (await res.json()) as { ok: boolean; item: ResumeData };
}

/** Everything the Overview screen shows, in one request. */
export async function getInsights(
  range: { start: string; end: string },
  options?: ReadOptions,
): Promise<AdminInsights> {
  const qs = new URLSearchParams({ start: range.start, end: range.end });
  return readJson<AdminInsights>(
    withQuery("/api/admin/insights", qs),
    "insights",
    options,
    15_000,
  );
}

export async function getContentInsights(
  params: {
    kind: ContentAnalyticsKind;
    itemId: string;
    start: string;
    end: string;
  },
  options?: ReadOptions,
): Promise<ContentInsights> {
  const qs = new URLSearchParams(params);
  return readJson<ContentInsights>(
    withQuery("/api/admin/analytics/content", qs),
    `${params.kind} analytics`,
    options,
    15_000,
  );
}

export async function getConversations(
  params: {
    start?: string;
    end?: string;
    status?: "active" | "errored";
    q?: string;
    sessionId?: string;
    limit?: number;
    skip?: number;
  },
  options?: ReadOptions,
): Promise<AdminConversationsListResponse> {
  const qs = new URLSearchParams();
  if (params.start) qs.set("start", params.start);
  if (params.end) qs.set("end", params.end);
  if (params.status) qs.set("status", params.status);
  if (params.q) qs.set("q", params.q);
  if (params.sessionId) qs.set("session_id", params.sessionId);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.skip != null) qs.set("skip", String(params.skip));

  return readJson<AdminConversationsListResponse>(
    withQuery("/api/admin/analytics/conversations", qs),
    "conversations",
    options,
    15_000,
  );
}

export async function getConversationDetail(
  conversationId: string,
  options?: ReadOptions,
): Promise<AdminConversationDetailResponse> {
  return readJson<AdminConversationDetailResponse>(
    `/api/admin/analytics/conversations/${encodeURIComponent(conversationId)}`,
    `conversation ${conversationId}`,
    options,
    10_000,
  );
}

export async function getConversationTurns(
  conversationId: string,
  params: { q?: string; limit?: number; skip?: number },
  options?: ReadOptions,
): Promise<AdminConversationTurnsResponse> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.skip != null) qs.set("skip", String(params.skip));

  return readJson<AdminConversationTurnsResponse>(
    withQuery(
      `/api/admin/analytics/conversations/${encodeURIComponent(conversationId)}/turns`,
      qs,
    ),
    `conversation turns ${conversationId}`,
    options,
  );
}

export async function deleteConversation(
  conversationId: string,
  token?: string,
): Promise<void> {
  const res = await fetchWithTimeout(
    `/api/admin/analytics/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: "DELETE",
      timeoutMs: 10000,
      authToken: token,
    },
  );
  if (!res.ok)
    throw new Error(
      `Failed to delete conversation ${conversationId}: ${res.status}`,
    );
}
