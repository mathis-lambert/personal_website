import { fetchWithTimeout } from "@/api/utils";
import type { EditorialDraft, EditorialItem } from "@/admin/editorial/model";
import { editorialPayload } from "@/admin/editorial/model";

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
