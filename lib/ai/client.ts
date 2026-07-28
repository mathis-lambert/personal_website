import "server-only";
import { getAiEnv } from "@/lib/ai/env";
const parseErrorDetails = async (res: Response): Promise<string> => {
  try {
    const json = await res.json();
    return JSON.stringify(json);
  } catch {
    try {
      return await res.text();
    } catch {
      return "";
    }
  }
};

export type VectorStoreSearchResult = {
  object: "list";
  data: Array<{ payload?: Record<string, unknown>; score?: number }>;
};

export const searchVectorStore = async (params: {
  query: string;
  limit?: number;
  vectorStoreId?: string;
}): Promise<VectorStoreSearchResult> => {
  const { baseUrl, apiKey, vectorStoreId: envStore } = getAiEnv();
  const storeId = params.vectorStoreId || envStore;

  const response = await fetch(
    `${baseUrl}/vector_stores/${encodeURIComponent(storeId)}/search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-ML-API-Key": apiKey,
      },
      body: JSON.stringify({
        query: params.query,
        limit: params.limit ?? 5,
      }),
    },
  );

  if (!response.ok) {
    const details = await parseErrorDetails(response);
    throw new Error(
      `Vector store search failed (${response.status}). ${details}`.trim(),
    );
  }

  return (await response.json()) as VectorStoreSearchResult;
};
