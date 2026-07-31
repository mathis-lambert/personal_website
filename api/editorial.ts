import { fetchWithTimeout } from "@/api/utils";
import type { EditorialDraft, EditorialItem } from "@/admin/editorial/model";
import { editorialPayload } from "@/admin/editorial/model";
import type { EditorialPublicationSummary } from "@/types/editorial";

const errorMessage = async (response: Response) => {
  const body = (await response.json().catch(() => null)) as { detail?: string } | null;
  return body?.detail || `Request failed (${response.status}).`;
};

export const getEditorialItem = async (
  kind: EditorialDraft["kind"],
  id: string,
  signal?: AbortSignal,
) => {
  const response = await fetchWithTimeout(`/api/admin/${kind}/${id}`, {
    signal,
    timeoutMs: 12_000,
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return ((await response.json()) as { item: EditorialItem }).item;
};

export const saveEditorialItem = async (draft: EditorialDraft) => {
  const response = await fetchWithTimeout(
    draft._id ? `/api/admin/${draft.kind}/${draft._id}` : `/api/admin/${draft.kind}`,
    {
      method: draft._id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editorialPayload(draft)),
      timeoutMs: 15_000,
    },
  );
  if (!response.ok) throw new Error(await errorMessage(response));
  return ((await response.json()) as { item: EditorialItem }).item;
};

export const listEditorialPublications = async (
  kind: EditorialDraft["kind"],
  id: string,
  signal?: AbortSignal,
) => {
  const response = await fetchWithTimeout(
    `/api/admin/${kind}/${id}/publications`,
    {
      signal,
      timeoutMs: 12_000,
    },
  );
  if (!response.ok) throw new Error(await errorMessage(response));
  return (
    (await response.json()) as {
      publications: EditorialPublicationSummary[];
    }
  ).publications;
};

const createEditorialPublication = async (
  kind: EditorialDraft["kind"],
  id: string,
  sourceVersion?: number,
) => {
  const response = await fetchWithTimeout(
    `/api/admin/${kind}/${id}/publications`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        sourceVersion === undefined ? {} : { sourceVersion },
      ),
      timeoutMs: 15_000,
    },
  );
  if (!response.ok) throw new Error(await errorMessage(response));
  return (await response.json()) as {
    item: EditorialItem;
    publication: EditorialPublicationSummary;
  };
};

export const publishEditorialItem = (
  kind: EditorialDraft["kind"],
  id: string,
) => createEditorialPublication(kind, id);

export const rollbackEditorialItem = (
  kind: EditorialDraft["kind"],
  id: string,
  sourceVersion: number,
) => createEditorialPublication(kind, id, sourceVersion);

export const archiveEditorialItem = async (
  kind: EditorialDraft["kind"],
  id: string,
) => {
  const response = await fetchWithTimeout(
    `/api/admin/${kind}/${id}/publications`,
    { method: "DELETE", timeoutMs: 12_000 },
  );
  if (!response.ok) throw new Error(await errorMessage(response));
  return ((await response.json()) as { item: EditorialItem }).item;
};

export const deleteEditorialItem = async (
  kind: EditorialDraft["kind"],
  id: string,
) => {
  const response = await fetchWithTimeout(`/api/admin/${kind}/${id}`, {
    method: "DELETE",
    timeoutMs: 10_000,
  });
  if (!response.ok) throw new Error(await errorMessage(response));
};
