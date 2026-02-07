import { fetchWithTimeout } from "@/api/utils";
import type {
  AdminAnalyticsActivityResponse,
  AdminAnalyticsEndpointsResponse,
  AdminAnalyticsErrorsResponse,
  AdminAnalyticsOverviewResponse,
  AdminAnalyticsTimeseriesResponse,
  AdminCollectionName,
  AdminListCollectionName,
  AnalyticsGranularity,
  ApiActorType,
  Article,
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

export async function getCollections(token?: string): Promise<string[]> {
  const res = await fetchWithTimeout(`/api/admin/collections`, {
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
  const res = await fetchWithTimeout(`/api/admin/data/${collection}`, {
    timeoutMs: 10000,
    authToken: token,
  });
  if (!res.ok) throw new Error(`Failed to read ${collection}: ${res.status}`);
  const data = await res.json();
  return data?.data as T;
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

export async function createItem(
  collection: "projects",
  item: AdminCreateProjectInput,
  token?: string,
): Promise<{ ok: boolean; _id: string; item: Project }>;
export async function createItem(
  collection: "articles",
  item: AdminCreateArticleInput,
  token?: string,
): Promise<{ ok: boolean; _id: string; item: Article }>;
export async function createItem(
  collection: Extract<AdminCollectionName, "projects" | "articles">,
  item: AdminCreateProjectInput | AdminCreateArticleInput,
  token?: string,
): Promise<{ ok: boolean; _id: string; item: Project | Article }> {
  const res = await fetchWithTimeout(`/api/admin/${collection}`, {
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
    _id: string;
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
  const url =
    collection === "resume"
      ? `/api/admin/resume`
      : `/api/admin/${collection}/${encodeURIComponent(id)}`;

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
    `/api/admin/${collection}/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      timeoutMs: 8000,
      authToken: token,
    },
  );
  if (!res.ok)
    throw new Error(`Failed to delete ${collection}#${id}: ${res.status}`);
}

type AnalyticsCommonParams = {
  start?: string;
  end?: string;
  route?: string;
  method?: string;
  actorType?: ApiActorType;
};

const withCommonAnalyticsParams = (
  params: AnalyticsCommonParams,
): URLSearchParams => {
  const qs = new URLSearchParams();
  if (params.start) qs.set("start", params.start);
  if (params.end) qs.set("end", params.end);
  if (params.route) qs.set("route", params.route);
  if (params.method) qs.set("method", params.method.toUpperCase());
  if (params.actorType) qs.set("actor_type", params.actorType);
  return qs;
};

export async function getAnalyticsOverview(
  params: AnalyticsCommonParams,
  token?: string,
): Promise<AdminAnalyticsOverviewResponse> {
  const qs = withCommonAnalyticsParams(params);
  const url = `/api/admin/analytics/overview${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: 12000,
    authToken: token,
  });
  if (!res.ok)
    throw new Error(`Failed to fetch analytics overview: ${res.status}`);
  return (await res.json()) as AdminAnalyticsOverviewResponse;
}

export async function getAnalyticsTimeseries(
  params: AnalyticsCommonParams & {
    granularity?: AnalyticsGranularity;
  },
  token?: string,
): Promise<AdminAnalyticsTimeseriesResponse> {
  const qs = withCommonAnalyticsParams(params);
  if (params.granularity) qs.set("granularity", params.granularity);

  const url = `/api/admin/analytics/timeseries${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: 12000,
    authToken: token,
  });
  if (!res.ok)
    throw new Error(`Failed to fetch analytics timeseries: ${res.status}`);
  return (await res.json()) as AdminAnalyticsTimeseriesResponse;
}

export async function getAnalyticsEndpoints(
  params: AnalyticsCommonParams & { limit?: number },
  token?: string,
): Promise<AdminAnalyticsEndpointsResponse> {
  const qs = withCommonAnalyticsParams(params);
  if (params.limit != null) qs.set("limit", String(params.limit));

  const url = `/api/admin/analytics/endpoints${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: 12000,
    authToken: token,
  });
  if (!res.ok)
    throw new Error(`Failed to fetch endpoint analytics: ${res.status}`);
  return (await res.json()) as AdminAnalyticsEndpointsResponse;
}

export async function getAnalyticsErrors(
  params: AnalyticsCommonParams & {
    statusMin?: number;
    statusMax?: number;
    limit?: number;
    skip?: number;
  },
  token?: string,
): Promise<AdminAnalyticsErrorsResponse> {
  const qs = withCommonAnalyticsParams(params);
  if (params.statusMin != null) qs.set("status_min", String(params.statusMin));
  if (params.statusMax != null) qs.set("status_max", String(params.statusMax));
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.skip != null) qs.set("skip", String(params.skip));

  const url = `/api/admin/analytics/errors${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: 12000,
    authToken: token,
  });
  if (!res.ok)
    throw new Error(`Failed to fetch analytics errors: ${res.status}`);
  return (await res.json()) as AdminAnalyticsErrorsResponse;
}

export async function getAnalyticsActivity(
  params: AnalyticsCommonParams & {
    type?: "api" | "ui" | "all";
    limit?: number;
    skip?: number;
  },
  token?: string,
): Promise<AdminAnalyticsActivityResponse> {
  const qs = withCommonAnalyticsParams(params);
  if (params.type) qs.set("type", params.type);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.skip != null) qs.set("skip", String(params.skip));

  const url = `/api/admin/analytics/activity${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: 12000,
    authToken: token,
  });
  if (!res.ok)
    throw new Error(`Failed to fetch analytics activity: ${res.status}`);
  return (await res.json()) as AdminAnalyticsActivityResponse;
}
