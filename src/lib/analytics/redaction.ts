const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /passphrase/i,
  /token/i,
  /secret/i,
  /api[-_]?key/i,
  /authorization/i,
  /cookie/i,
  /session/i,
];

const MAX_DEPTH = 5;
const MAX_KEYS_PER_OBJECT = 40;
const MAX_ITEMS_PER_ARRAY = 40;
const MAX_STRING_LENGTH = 600;

const isSensitiveKey = (key: string): boolean => {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
};

const truncate = (value: string): string => {
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}…`;
};

const sanitizeString = (value: string) => {
  const normalized = value.replace(/\u0000/g, "").trim();
  return truncate(normalized);
};

export const redactValue = (value: unknown, depth = 0): unknown => {
  if (value == null) return value;

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (depth >= MAX_DEPTH) {
    return "[TRUNCATED_DEPTH]";
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ITEMS_PER_ARRAY)
      .map((item) => redactValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [idx, [key, raw]] of Object.entries(value).entries()) {
      if (idx >= MAX_KEYS_PER_OBJECT) {
        out.__truncated__ = true;
        break;
      }
      if (isSensitiveKey(key)) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = redactValue(raw, depth + 1);
      }
    }
    return out;
  }

  return String(value);
};

export const redactHeaders = (headers: Headers): Record<string, string> => {
  const out: Record<string, string> = {};
  headers.forEach((raw, key) => {
    out[key] = isSensitiveKey(key) ? "[REDACTED]" : sanitizeString(raw);
  });
  return out;
};

const parseJsonSafely = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

export const parseAndRedactBody = (
  rawBody: string,
  contentType: string | null,
): unknown => {
  if (!rawBody) return undefined;

  const normalized = truncate(rawBody);

  if (contentType?.includes("application/json")) {
    return redactValue(parseJsonSafely(normalized));
  }

  if (contentType?.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(normalized);
    const mapped: Record<string, string | string[]> = {};
    for (const key of new Set(params.keys())) {
      const values = params.getAll(key);
      mapped[key] = values.length > 1 ? values : values[0] ?? "";
    }
    return redactValue(mapped);
  }

  return redactValue(normalized);
};

export const searchParamsToObject = (
  params: URLSearchParams,
): Record<string, string | string[]> => {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    out[key] = values.length > 1 ? values : values[0] ?? "";
  }
  return out;
};
