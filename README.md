# Personal Website

Next.js (App Router) app that powers mathislambert.fr. The site, API routes (chat proxy, resume export, admin analytics), and Mongo-backed content all live in this single service, packaged for Docker and deployed behind Traefik.

## Features

- Public pages for projects, articles, experiences, studies, and a downloadable resume.
- Chat assistant UI that calls `/api/chat/completions`, proxying to `ML_API_BASE_URL` with SSE and logging events to Mongo.
- Credentials-protected admin area at `/admin` (NextAuth JWT) to inspect content collections and activity.
- Resume export at `/api/resume/export` plus DB-backed metrics/analytics; `/api/health` pings Mongo connectivity.
- Tailwind v4 + Radix UI + framer-motion components, with Google Maps embed gated by `NEXT_PUBLIC_MAPS_PUBLIC_KEY`.

## Stack and layout

- Next.js 16 / React 19 / TypeScript with standalone output.
- MongoDB for content, resume data, and event logs.
- Docker multi-stage build (`Dockerfile`) producing a single runtime image.
- Compose files: `development/docker-compose.yml` (local dev with Mongo), `compose.dev.yaml` (local prod build), `compose.prod.yaml` (server deploy with Traefik labels).
- GitHub Actions `.github/workflows/cd.yaml` builds/pushes `ghcr.io/<owner>/personal-website` on tags and redeploys to the Raspberry Pi host.

## Environment

- Copy `src/.env.example` to `src/.env` for `npm run dev`; copy `.env.example` to `.env` for Docker/compose.
- Set `NEXT_PUBLIC_MAPS_PUBLIC_KEY`, `NEXT_PUBLIC_APP_VERSION`, and `NEXT_PUBLIC_MAINTENANCE_MODE` before building images (they are baked into the client).
- Provide runtime secrets: `PUBLIC_BASE_URL`, `ML_API_BASE_URL`, `ML_API_KEY`, `LLM_MODEL_NAME`, `NEXTAUTH_SECRET`, `ADMIN_USERNAME`/`ADMIN_PASSWORD` (or `INTERNAL_API_*`), and `MONGODB_URI`/`MONGODB_DB`. Optional Mongo bootstrap creds: `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`.
- `NEXTAUTH_URL` should point at the external URL in production when using NextAuth callbacks.

## Run locally

- Node: `cd src && npm ci && npm run dev` (expects Mongo reachable at `MONGODB_URI`, defaults to `mongodb://localhost:27017/personal_website`).
- Docker with live reload + Mongo: `docker compose -f development/docker-compose.yml up --build` (bind-mounts `src/` into the dev container).
- Prod-like image locally: `docker compose -f compose.dev.yaml up --build` (reads build args from `.env`).

## Deploy

- Runtime container listens on `3000`; Traefik labels and external networks are defined in `compose.prod.yaml`.
- Tag a commit (`v*`) → GitHub Actions builds the arm64 image, pushes to GHCR, then SSH deploys via `docker compose -f compose.prod.yaml up -d` on the server with secrets/vars for all env values.
- Manual deploy: set `OWNER` and `IMAGE_TAG`, export the needed env vars, then run `docker compose -f compose.prod.yaml up -d` on the host.

## API surface

- `GET /api/health` — database health check.
- `POST /api/chat/completions` — proxies to upstream ML API (SSE supported) and records `chat_completion` events.
- `GET /api/resume/export` — latest resume PDF; logs `resume_export` events.
- `/api/auth/[...nextauth]` — credentials login for `/admin`; `/api/admin/*` — protected CRUD + analytics endpoints.

## License

MIT — see `LICENSE`.
