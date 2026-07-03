# Railway deployment — DulceriaCar

## Automatic fix (no dashboard change required)

The frontend `build` script runs `frontend/scripts/ensure-node22.sh` first. When Railway uses Node 18, it upgrades to Node 22 and reinstalls dependencies before Vite runs. Your existing build command can stay:

```bash
pnpm --filter @dulceriacar/frontend build
```

Redeploy after pulling the latest `main`.

## Manual options (recommended long-term)

1. **Settings → Build**
   - **Root Directory**: leave empty (repo root)
   - **Railway config file**: `/frontend/railway.toml`
   - **Builder**: Dockerfile
   - **Dockerfile path**: `frontend/Dockerfile`
   - **Build Command**: **delete / leave empty**
   - **Start Command**: **delete / leave empty**

2. **Variables**
   - `VITE_API_URL` = your backend URL (required at build time)

3. **Redeploy** with **Clear build cache**

## Option B — Keep custom build command (works on Node 18 images)

If Railway keeps a manual build command, set it to:

```bash
bash scripts/railway-build-frontend.sh
```

Start command:

```bash
pnpm --filter @dulceriacar/frontend exec serve dist -s -l $PORT
```

## Option C — Environment variable only

Add service variable:

```text
RAILPACK_NODE_VERSION=22
```

Also add (legacy Nixpacks):

```text
NIXPACKS_NODE_VERSION=22
```

Then **remove** the manual build command `pnpm --filter @dulceriacar/frontend build` so Railpack/Nixpacks can use Node 22.

## Backend service

Uses **`backend/Dockerfile`** (builds `backend/dist/index.mjs`, runs migrations + seed on start).

1. **Settings → Build**
   - **Root Directory**: empty (repo root)
   - **Railway config file**: `/backend/railway.toml`
   - **Builder**: Dockerfile
   - **Dockerfile path**: `backend/Dockerfile`
   - **Build Command**: **empty**
   - **Start Command**: **empty** (defined in Dockerfile)

2. **Variables** (required):
   - `DATABASE_URL` — from Railway Postgres
   - `SESSION_SECRET` — random string
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — initial admin seed
   - `CORS_ORIGIN` — frontend URL (e.g. `https://your-frontend.up.railway.app`)
   - `NODE_ENV=production`

3. **Nixpacks fallback** (if not using Docker):
   - Build: `pnpm install --frozen-lockfile && pnpm --filter @dulceriacar/backend build`
   - Start: `bash scripts/railway-start-backend.sh`
   - Do **not** use `node dist/index.mjs` from repo root — dist is at `backend/dist/`.

## Verify success

Build logs should show **Node v22** or Docker step `FROM node:22-alpine`, not `18.20.5`.
