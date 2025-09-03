# Security Overview

The frontend authenticates with the backend using short‑lived, cookie‑based sessions.

## Session flow

1. `POST /api/auth/token` establishes a session. The backend negotiates with the external API using server‑side credentials and sets an opaque `HttpOnly` cookie plus a `XSRF-TOKEN` cookie.
2. Subsequent requests automatically include the session cookie. For `POST`, `PUT`, `PATCH`, and `DELETE` requests the frontend must send an `X-CSRF-Token` header whose value matches the `XSRF-TOKEN` cookie.
3. Sessions are renewed via `POST /api/auth/refresh` and cleared with `POST /api/auth/logout`.

API credentials and access tokens never appear in client code; they remain on the server.
