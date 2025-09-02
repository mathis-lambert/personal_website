import { fetchWithTimeout } from '@/api/utils';
import type { Article, Project } from '@/types';
import type {
  AdminCreateArticleInput,
  AdminCreateProjectInput,
  AdminExperience,
  AdminStudy,
  AdminUpdateArticleInput,
  AdminUpdateProjectInput,
} from '@/admin/types';

export type AdminCollectionName =
  | 'projects'
  | 'articles'
  | 'experiences'
  | 'studies'
  | 'resume';

export type AdminListCollectionName = Exclude<
  AdminCollectionName,
  'resume'
>;

const API_URL = (import.meta.env.VITE_API_URL as string)?.replace(/\/$/, '');
if (!API_URL) throw new Error('VITE_API_URL is not configured');

export async function getCollections(token: string): Promise<string[]> {
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
  token: string,
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
  token: string,
) {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/data/${collection}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    timeoutMs: 12000,
    authToken: token,
  });
  if (!res.ok)
    throw new Error(`Failed to replace ${collection}: ${res.status}`);
}

export async function createItem(
  collection: 'projects',
  item: AdminCreateProjectInput,
  token: string,
): Promise<{ ok: boolean; id: string; item: Project }>;
export async function createItem(
  collection: 'articles',
  item: AdminCreateArticleInput,
  token: string,
): Promise<{ ok: boolean; id: string; item: Article }>;
export async function createItem(
  collection: Extract<AdminCollectionName, 'projects' | 'articles'>,
  item: AdminCreateProjectInput | AdminCreateArticleInput,
  token: string,
): Promise<{ ok: boolean; id: string; item: Project | Article }> {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
    timeoutMs: 10000,
    authToken: token,
  });
  if (!res.ok)
    throw new Error(`Failed to create ${collection} item: ${res.status}`);
  return (await res.json()) as { ok: boolean; id: string; item: Project | Article };
}

export async function updateItem(
  collection: 'projects',
  id: string,
  patch: AdminUpdateProjectInput,
  token: string,
): Promise<{ ok: boolean; item: Project }>;
export async function updateItem(
  collection: 'articles',
  id: string,
  patch: AdminUpdateArticleInput,
  token: string,
): Promise<{ ok: boolean; item: Article }>;
export async function updateItem(
  collection: 'experiences',
  id: string,
  patch: AdminExperience,
  token: string,
): Promise<{ ok: boolean; item: AdminExperience }>;
export async function updateItem(
  collection: 'studies',
  id: string,
  patch: AdminStudy,
  token: string,
): Promise<{ ok: boolean; item: AdminStudy }>;
export async function updateItem(
  collection: AdminCollectionName,
  id: string,
  patch: unknown,
  token: string,
): Promise<{ ok: boolean; item: unknown }> {
  const res = await fetchWithTimeout(
    `${API_URL}/api/admin/${collection}/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
      timeoutMs: 10000,
      authToken: token,
    },
  );
  if (!res.ok)
    throw new Error(`Failed to update ${collection}#${id}: ${res.status}`);
  return (await res.json()) as { ok: boolean; item: unknown };
}

export async function deleteItem(
  collection: AdminListCollectionName,
  id: string,
  token: string,
) {
  const res = await fetchWithTimeout(
    `${API_URL}/api/admin/${collection}/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      timeoutMs: 8000,
      authToken: token,
    },
  );
  if (!res.ok)
    throw new Error(`Failed to delete ${collection}#${id}: ${res.status}`);
}
