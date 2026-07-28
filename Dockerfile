# syntax=docker/dockerfile:1
FROM node:24-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS dev
ENV NODE_ENV=development
COPY . .
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

# A one-off image for running `migrations/`. The `runner` stage below ships only
# `.next/standalone` — traced from what the app itself imports at request time,
# which never includes a migration script — so it has no `migrations/` directory
# and no general-purpose `node_modules` to run one with. This stage reuses `deps`
# (full `npm ci`, so the `mongodb` driver is present) and copies the full source,
# the same shape as `dev` above.
FROM deps AS migrator
ENV NODE_ENV=production
COPY . .
CMD ["node", "migrations/run.mjs"]

FROM deps AS builder
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ML_BASE_URL
ARG NEXT_PUBLIC_MAPS_PUBLIC_KEY
ARG NEXT_PUBLIC_APP_VERSION
ARG NEXT_PUBLIC_MAINTENANCE_MODE
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_ML_BASE_URL=${NEXT_PUBLIC_ML_BASE_URL}
ENV NEXT_PUBLIC_MAPS_PUBLIC_KEY=${NEXT_PUBLIC_MAPS_PUBLIC_KEY}
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
ENV NEXT_PUBLIC_MAINTENANCE_MODE=${NEXT_PUBLIC_MAINTENANCE_MODE}
COPY . .
RUN npm run build

FROM node:22-slim AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
