import "server-only";

const DEFAULT_BASE_URL = "https://api.mathislambert.fr/v1";

export type AiEnv = {
  baseUrl: string;
  apiKey: string;
  model: string;
  vectorStoreId: string;
};

export const getAiEnv = (): AiEnv => {
  const baseUrl = (process.env.ML_API_BASE_URL || DEFAULT_BASE_URL).trim();
  const apiKey = process.env.ML_API_KEY;
  const model = process.env.LLM_MODEL_NAME || "openai/gpt-oss-120b";
  const vectorStoreId =
    process.env.ML_API_VECTOR_STORE_ID || "mathis_bio_store";

  if (!apiKey) {
    throw new Error("ML_API_KEY is not set.");
  }

  return { baseUrl, apiKey, model, vectorStoreId };
};
