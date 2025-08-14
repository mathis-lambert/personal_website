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

  if (!tokenRes.ok) {
    throw new Error('Token request failed');
  }

  const data = await tokenRes.json();
  return data.access_token as string;
}

export function getAuthHeaders(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

