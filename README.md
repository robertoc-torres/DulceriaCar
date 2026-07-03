# DulceriaCar

Mobile-first web application for **DULCERA CAR** — personalized wholesale candies and die-cut labels. Migrated from a Replit Expo export to a maintainable Vite + React frontend with Express + PostgreSQL backend.

## Stack

- **Frontend**: Vite, React 19, Tailwind CSS 4, wouter, TanStack Query
- **Backend**: Express 5, Drizzle ORM, PostgreSQL, express-session
- **Deploy**: Railway (frontend + backend + Postgres)

## Project structure

```text
DulceriaCar/
  frontend/     # Customer + admin UI
  backend/      # REST API
  packages/db/  # Drizzle schema + seed data
  legacy/       # Original Expo app (reference only)
```

## Local development

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL

### Setup

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET

pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Admin: http://localhost:5173/admin/login

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run frontend + backend in parallel |
| `pnpm build` | Build both apps for production |
| `pnpm db:push` | Push Drizzle schema to PostgreSQL |
| `pnpm db:seed` | Seed config + admin user |

## Environment variables

See [`.env.example`](.env.example).

**Backend**: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGIN`, `PORT`

**Frontend**: `VITE_API_URL` (backend URL in production)

## Railway deployment

Create three services from this repo:

### 1. PostgreSQL

Add Railway Postgres plugin. Copy `DATABASE_URL` to the backend service.

### 2. Backend (`/backend`)

- **Build**: `pnpm install && pnpm --filter @dulceriacar/backend build`
- **Start**: `node dist/index.mjs`
- **Root directory**: `/` (monorepo root) or set working directory appropriately

Run migrations on deploy:

```bash
pnpm db:push && pnpm db:seed
```

Set env vars: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGIN` (frontend URL), `NODE_ENV=production`

Health check: `GET /api/healthz`

### 3. Frontend (`/frontend`)

Uses **`frontend/Dockerfile`** (Node 22) so the build does not depend on Nixpacks Node 18.

- **Root directory**: repository root (not `/frontend`)
- **Config file**: `frontend/railway.toml`
- **Build**: Docker (`frontend/Dockerfile`)
- **Build-time env**: `VITE_API_URL=https://your-backend.railway.app`

If you must use Nixpacks/Railpack instead of Docker, set `NIXPACKS_NODE_VERSION=22` or ensure `railpack.toml` / `.node-version` is picked up.

Set `VITE_API_URL` to the backend Railway URL at build time.

## Admin

Log in at `/admin/login` with credentials from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Edit business config (phones, pricing catalog, discount codes, terms) at `/admin/config`.

Public config is exposed via `GET /api/public/config`. Private values are never returned to unauthenticated clients.

## License

MIT
