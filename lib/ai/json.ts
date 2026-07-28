import "server-only";
import { ObjectId } from "mongodb";

export const toJsonable = (value: unknown): unknown => {
  if (value instanceof ObjectId) {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => toJsonable(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        toJsonable(v),
      ]),
    );
  }
  return value;
};

export const safeJsonStringify = (value: unknown): string =>
  JSON.stringify(toJsonable(value));
