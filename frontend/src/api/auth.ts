async function sign(username: string, password: string, nonce: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(password);
  const data = encoder.encode(`${username}:${nonce}`);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function fetchToken(): Promise<string> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const username = import.meta.env.VITE_API_USERNAME;
  const password = import.meta.env.VITE_API_PASSWORD;

  if (!username || !password) {
    throw new Error('Environment variables VITE_API_USERNAME and VITE_API_PASSWORD must be set');
  }

  const challengeRes = await fetch(`${apiUrl}/api/auth/challenge`);
  if (!challengeRes.ok) {
    throw new Error('Challenge request failed');
  }
  const { nonce } = await challengeRes.json();
  const signature = await sign(username, password, nonce);

  const tokenRes = await fetch(`${apiUrl}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, nonce, signature }),
  });

  // If the first request succeeds, we return the token immediately
  if (tokenRes.ok) {
    const data = await tokenRes.json();
    return data.access_token as string;
  }

  // Immediate error handling
  if (tokenRes.status === 401 || tokenRes.status === 403) {
    throw new Error('Authentication failed during token request');
  }
  if (tokenRes.status >= 500) {
    throw new Error(`Server error (${tokenRes.status}) during token request`);
  }

  // Last chance to get the token: if the first request fails, we try again with a new nonce
  const retryChallengeRes = await fetch(`${apiUrl}/api/auth/challenge`);
  if (!retryChallengeRes.ok) {
    throw new Error(`Challenge retry failed with status ${retryChallengeRes.status}: ${retryChallengeRes.statusText}`);
  }
  const { nonce: retryNonce } = await retryChallengeRes.json();
  const retrySignature = await sign(username, password, retryNonce);

  const retryTokenRes = await fetch(`${apiUrl}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, nonce: retryNonce, signature: retrySignature }),
  });

  if (retryTokenRes.ok) {
    const data = await retryTokenRes.json();
    return data.access_token as string;
  }

  if (retryTokenRes.status === 401 || retryTokenRes.status === 403) {
    throw new Error('Authentication failed during token retry');
  }
  if (retryTokenRes.status >= 500) {
    throw new Error(`Server error (${retryTokenRes.status}) during token retry`);
  }

  throw new Error(`Token retry failed with status ${retryTokenRes.status}: ${retryTokenRes.statusText}`);
}

export function getAuthHeaders(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

