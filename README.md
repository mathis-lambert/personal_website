# Personal Website

Source for [mathislambert.fr](https://mathislambert.fr): public portfolio, editorial admin, analytics, media storage, resume export, and chat assistant.

## Stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4, shadcn/Base UI
- MongoDB
- S3-compatible media storage
- Docker and Traefik

## Local development

```bash
cp .env.example .env
npm ci
npm run dev
```

Useful commands:

```bash
npm run seed:dev
npm run migrate
npm run migrate:status
npm run lint
npm run build
```

The application requires MongoDB. Editorial media additionally requires the `MEDIA_S3_*` and `MEDIA_PUBLIC_BASE_URL` variables documented in `.env.example`.

## Structure

```text
app/            Next.js routes and route handlers
components/     application UI grouped by domain
components/ui/  shadcn primitives
api/            browser-side HTTP clients
hooks/          reusable client hooks
lib/            domain logic, data access, and server integrations
types/          domain contracts
migrations/     ordered MongoDB migrations
```

Components use `PascalCase.tsx`, hooks use `useCamelCase.ts`, and plain modules use `camelCase.ts`. Cross-domain imports use the `@/` alias.

## Docker

```bash
docker compose -f development/docker-compose.yml up --build
```

Production images are built from `Dockerfile` and deployed through `compose.prod.yaml`.

## License

MIT
