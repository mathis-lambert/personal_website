import { fetchWithTimeout } from "@/api/utils";
import type {
  AdminCollectionName,
  AdminListCollectionName,
  Article,
  EventsAnalyticsResponse,
  EventsListResponse,
  Project,
  ResumeData,
} from "@/types";
import type {
  AdminCreateArticleInput,
  AdminCreateProjectInput,
  AdminUpdateArticleInput,
  AdminUpdateProjectInput,
  AdminUpdateResumeInput,
} from "@/admin/types";
import type { TimelineData } from "@/components/ui/ScrollableTimeline";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "";

export async function getCollections(token?: string): Promise<string[]> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/collections`, {
    timeoutMs: 8000,
    authToken: token,
  });
  if (!res.ok) throw new Error(`Failed to list collections: ${res.status}`);
  const data = await res.json();
  const names = Array.isArray(data?.collections)
    ? (data.collections as { name: string }[]).map((c) => c.name)
    : [];
  return names;
}

export async function getCollectionData<T = unknown>(
  collection: AdminCollectionName,
  token?: string,
): Promise<T> {
  const res = await fetchWithTimeout(
    `${API_URL}/api/admin/data/${collection}`,
    {
      timeoutMs: 10000,
      authToken: token,
    },
  );
  if (!res.ok) throw new Error(`Failed to read ${collection}: ${res.status}`);
  const data = await res.json();
  return data?.data as T;
}

export async function replaceCollection(
  collection: AdminCollectionName,
  data: unknown,
  token?: string,
) {
  const res = await fetchWithTimeout(
    `${API_URL}/api/admin/data/${collection}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      timeoutMs: 12000,
      authToken: token,
    },
  );
  if (!res.ok)
    throw new Error(`Failed to replace ${collection}: ${res.status}`);
}

export async function createItem(
  collection: "projects",
  item: AdminCreateProjectInput,
  token?: string,
): Promise<{ ok: boolean; id: string; item: Project }>;
export async function createItem(
  collection: "articles",
  item: AdminCreateArticleInput,
  token?: string,
): Promise<{ ok: boolean; id: string; item: Article }>;
export async function createItem(
  collection: Extract<AdminCollectionName, "projects" | "articles">,
  item: AdminCreateProjectInput | AdminCreateArticleInput,
  token?: string,
): Promise<{ ok: boolean; id: string; item: Project | Article }> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/${collection}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
    timeoutMs: 10000,
    authToken: token,
  });
  if (!res.ok)
    throw new Error(`Failed to create ${collection} item: ${res.status}`);
  return (await res.json()) as {
    ok: boolean;
    id: string;
    item: Project | Article;
  };
}

export async function updateItem(
  collection: "projects",
  id: string,
  patch: AdminUpdateProjectInput,
  token?: string,
): Promise<{ ok: boolean; item: Project }>;
export async function updateItem(
  collection: "resume",
  id: string,
  patch: AdminUpdateResumeInput,
  token?: string,
): Promise<{ ok: boolean; item: ResumeData }>;
export async function updateItem(
  collection: "articles",
  id: string,
  patch: AdminUpdateArticleInput,
  token?: string,
): Promise<{ ok: boolean; item: Article }>;
export async function updateItem(
  collection: "experiences",
  id: string,
  patch: TimelineData,
  token?: string,
): Promise<{ ok: boolean; item: TimelineData }>;
export async function updateItem(
  collection: "studies",
  id: string,
  patch: TimelineData,
  token?: string,
): Promise<{ ok: boolean; item: TimelineData }>;
export async function updateItem(
  collection: AdminCollectionName,
  id: string,
  patch: unknown,
  token?: string,
): Promise<{ ok: boolean; item: unknown }> {
  // Special case: resume doesn't need an item id; backend exposes /api/admin/resume
  const url =
    collection === "resume"
      ? `${API_URL}/api/admin/resume`
      : `${API_URL}/api/admin/${collection}/${encodeURIComponent(id)}`;

  const res = await fetchWithTimeout(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
    timeoutMs: 10000,
    authToken: token,
  });
  if (!res.ok)
    throw new Error(`Failed to update ${collection}#${id}: ${res.status}`);
  return (await res.json()) as { ok: boolean; item: unknown };
}

export async function deleteItem(
  collection: AdminListCollectionName,
  id: string,
  token?: string,
) {
  const res = await fetchWithTimeout(
    `${API_URL}/api/admin/${collection}/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      timeoutMs: 8000,
      authToken: token,
    },
  );
  if (!res.ok)
    throw new Error(`Failed to delete ${collection}#${id}: ${res.status}`);
}

export async function getEventsAnalytics(
  params: {
    start?: string; // ISO8601
    end?: string; // ISO8601
    granularity?: "hour" | "day" | "month";
    actions?: string[]; // optional filter list
    groupBy?: "action" | "location";
  },
  token?: string,
): Promise<EventsAnalyticsResponse> {
  const qs = new URLSearchParams();
  if (params.start) qs.set("start", params.start);
  if (params.end) qs.set("end", params.end);
  if (params.granularity) qs.set("granularity", params.granularity);
  if (params.actions && params.actions.length)
    qs.set("action", params.actions.join(","));
  if (params.groupBy) qs.set("group_by", params.groupBy);
  const url = `${API_URL}/api/admin/analytics/events${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: 12000,
    authToken: token,
  });
  if (!res.ok)
    throw new Error(`Failed to fetch events analytics: ${res.status}`);
  return (await res.json()) as EventsAnalyticsResponse;
}

export async function getEventsList(
  params: {
    start?: string;
    end?: string;
    action?: string | string[];
    limit?: number;
    skip?: number;
    sort?: "asc" | "desc";
  },
  token?: string,
): Promise<EventsListResponse> {
  const qs = new URLSearchParams();
  if (params.start) qs.set("start", params.start);
  if (params.end) qs.set("end", params.end);
  if (params.action)
    qs.set(
      "action",
      Array.isArray(params.action) ? params.action.join(",") : params.action,
    );
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.skip != null) qs.set("skip", String(params.skip));
  if (params.sort) qs.set("sort", params.sort);
  const url = `${API_URL}/api/admin/events${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: 12000,
    authToken: token,
  });
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
  return (await res.json()) as EventsListResponse;
}
