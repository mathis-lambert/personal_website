# 🚀 personal_website

Personal website with a modern React frontend and a FastAPI backend. It serves public content (projects, articles, resume) and includes an AI chat assistant with streaming responses and RAG.

## 🌟 Features

- **Streaming LLM Chat (SSE)**: Chat endpoint streams responses and supports auto tool execution via `ml-api-client`.
- **RAG Retrieval**: Vector store search (e.g., `mathis_bio_store`) used to ground answers to personal data.
- **Content API**: Articles, projects, experiences, studies, and resume served from MongoDB.
- **Article Metrics**: Track views/likes/shares via lightweight endpoints.
- **Auth**: Short‑lived JWTs (PyJWT) issued via HMAC challenge (`/api/auth/challenge` → `/api/auth/token`).
- **API Docs**: OpenAPI JSON at `/api/v1/openapi.json`, Swagger UI at `/swagger`, ReDoc at `/api-docs`.
- **CORS & Maintenance**: Configurable allowed origins and maintenance mode via environment variables.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS, Radix UI primitives, Framer Motion, React Router, Lucide Icons, React Markdown (+ GFM/Math/KaTeX), Mermaid, Syntax Highlighting, Sonner toasts.
- **Backend**: FastAPI, Uvicorn, Motor/PyMongo, `ml-api-client`, PyJWT, python-dotenv (dev).
- **Database**: MongoDB (Motor async driver).
- **Containers**: Dockerfiles for frontend and backend; `docker-compose.yml` with Traefik labels.

## 🔌 API Overview

- `GET /api/health`: Health check.
- `GET /api/auth/challenge` → `POST /api/auth/token`: Obtain JWT for protected routes.
- `POST /api/chat/completions`: Streaming chat completions (SSE) with optional tool calls.
- `GET /api/articles/all` · `GET /api/articles/{slug}` · metrics endpoints.
- `GET /api/projects/all` · `GET /api/projects/{slug}`.
- `GET /api/experiences/all` · `GET /api/studies/all` · `GET /api/resume`.

## 📜 License

MIT License — see `LICENSE` for details.

## 📞 Contact

- LinkedIn: https://www.linkedin.com/in/mathis-lambert
