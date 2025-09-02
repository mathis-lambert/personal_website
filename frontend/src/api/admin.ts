import { fetchWithTimeout } from '@/api/utils';

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
  collection: Extract<AdminCollectionName, 'projects' | 'articles'>,
  item: unknown,
  token: string,
) {
  const res = await fetchWithTimeout(`${API_URL}/api/admin/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
    timeoutMs: 10000,
    authToken: token,
  });
  if (!res.ok)
    throw new Error(`Failed to create ${collection} item: ${res.status}`);
  return (await res.json()) as { ok: boolean; id: string; item: unknown };
}

export async function updateItem(
  collection: AdminCollectionName,
  id: string,
  patch: unknown,
  token: string,
) {
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

