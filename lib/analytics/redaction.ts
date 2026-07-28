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

const getMaxTextLength = (): number => {
  const raw = process.env.CHAT_LOG_MAX_TEXT_CHARS?.trim();
  if (!raw) return 4000;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 4000;
  return Math.round(parsed);
};

const isSensitiveKey = (key: string): boolean => {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
};

const truncate = (value: string, maxLength = getMaxTextLength()): string => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}…`;
};

const redactTokenLikeFragments = (input: string): string => {
  return input
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[REDACTED_EMAIL]",
    )
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[REDACTED_PHONE]")
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_CARD]")
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+\b/g,
      "[REDACTED_JWT]",
    )
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED_KEY]")
    .replace(
      /\b(xox[baprs]-[A-Za-z0-9-]{10,}|ghp_[A-Za-z0-9]{20,}|glpat-[A-Za-z0-9_-]{20,})\b/g,
      "[REDACTED_TOKEN]",
    )
    .replace(
      /(password|passwd|secret|token)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    );
};

export const redactFreeText = (input: string): string => {
  return redactTokenLikeFragments(input.replace(/\u0000/g, "").trim());
};

const sanitizeString = (value: string) => {
  return truncate(redactFreeText(value));
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
