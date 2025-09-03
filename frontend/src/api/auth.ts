const API_URL = (import.meta.env.VITE_API_URL as string)?.replace(/\/$/, '')
if (!API_URL) throw new Error('VITE_API_URL is not configured')

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : undefined
}

export function getCsrfToken(): string | undefined {
  return getCookie('XSRF-TOKEN')
}

export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  const data = await res.json()
  return data.access_token as string
}

export async function fetchToken(): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/token`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`Token request failed: ${res.status}`)
}

export async function refreshToken(): Promise<void> {
  const csrf = getCsrfToken()
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: csrf ? { 'X-CSRF-Token': csrf } : undefined,
  })
  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`)
}

export async function logout(): Promise<void> {
  const csrf = getCsrfToken()
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: csrf ? { 'X-CSRF-Token': csrf } : undefined,
  })
  if (!res.ok) throw new Error(`Logout failed: ${res.status}`)
}

export function getAuthHeaders(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {}
}
