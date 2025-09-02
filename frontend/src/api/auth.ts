const encoder = new TextEncoder();
const HEX = new Array(256)
  .fill(0)
  .map((_, i) => i.toString(16).padStart(2, '0'));

const API_URL = (import.meta.env.VITE_API_URL as string)?.replace(/\/$/, '');
const USERNAME = import.meta.env.VITE_API_USERNAME as string;
const PASSWORD = import.meta.env.VITE_API_PASSWORD as string;

if (!API_URL) throw new Error('API URL must be set');
if (!USERNAME || !PASSWORD)
  throw new Error('API username and password must be set');

type ChallengeResponse = { nonce: string };
type TokenResponse = { access_token: string; expires_in?: number };

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += HEX[bytes[i]];
  return out;
}

let hmacKeyPromise: Promise<CryptoKey> | null = null;
function getHmacKey(): Promise<CryptoKey> {
  if (!hmacKeyPromise) {
    hmacKeyPromise = crypto.subtle.importKey(
      'raw',
      encoder.encode(PASSWORD),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
  }
  return hmacKeyPromise;
}

async function sign(username: string, nonce: string): Promise<string> {
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${username}:${nonce}`),
  );
  return toHex(sig);
}

async function signWithPassword(
  username: string,
  nonce: string,
  password: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${username}:${nonce}`),
  );
  return toHex(sig);
}

async function fetchJSON<T>(
  input: RequestInfo,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const { timeoutMs = 10000, ...rest } = init ?? {};
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...rest, signal: ctrl.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`,
      );
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(t);
  }
}

async function getNonce(): Promise<string> {
  const { nonce } = await fetchJSON<ChallengeResponse>(
    `${API_URL}/api/auth/challenge`,
  );
  if (!nonce) throw new Error('Challenge missing nonce');
  return nonce;
}

async function requestToken(nonce: string): Promise<TokenResponse> {
  const signature = await sign(USERNAME, nonce);
  return fetchJSON<TokenResponse>(`${API_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, nonce, signature }),
  });
}

async function requestTokenWithCredentials(
  username: string,
  password: string,
  nonce: string,
): Promise<TokenResponse> {
  const signature = await signWithPassword(username, nonce, password);
  return fetchJSON<TokenResponse>(`${API_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, nonce, signature }),
  });
}

let tokenCache: { token: string; expTs?: number } | null = null;
let inFlight: Promise<string> | null = null;

function isTokenValid(): boolean {
  if (!tokenCache) return false;
  const skew = 30_000; // clock skew margin
  if (!tokenCache.expTs) return true;
  return Date.now() + skew < tokenCache.expTs;
}

export async function fetchToken(force?: boolean): Promise<string> {
  if (!force && isTokenValid()) return tokenCache!.token;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      try {
        const first = await requestToken(await getNonce());
        const expTs = first.expires_in
          ? Date.now() + first.expires_in * 1000
          : undefined;
        tokenCache = { token: first.access_token, expTs };
        return first.access_token;
      } catch (e: unknown) {
        // Retry on 4xx error (nonce/credentials). Otherwise, propagate.
        const msg = String((e as Error)?.message ?? '');
        if (!/HTTP 4\d{2}/.test(msg)) throw e;
        const retry = await requestToken(await getNonce());
        const expTs = retry.expires_in
          ? Date.now() + retry.expires_in * 1000
          : undefined;
        tokenCache = { token: retry.access_token, expTs };
        return retry.access_token;
      }
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function getAuthHeaders(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function authFetch(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  const token = await fetchToken();
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Authorization'))
    headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

// --- Admin-specific token exchange (manual credentials) ---
export async function exchangeHmacToken(
  username: string,
  password: string,
): Promise<string> {
  // Single exchange without reusing global token cache
  try {
    const first = await requestTokenWithCredentials(
      username,
      password,
      await getNonce(),
    );
    return first.access_token;
  } catch (e: unknown) {
    const msg = String((e as Error)?.message ?? '');
    if (!/HTTP 4\d{2}/.test(msg)) throw e;
    const retry = await requestTokenWithCredentials(
      username,
      password,
      await getNonce(),
    );
    return retry.access_token;
  }
}
