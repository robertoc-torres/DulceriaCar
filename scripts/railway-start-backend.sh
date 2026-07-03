#!/usr/bin/env bash
# Nixpacks/Railway start when repo root is /app (dist lives in backend/dist).
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

if [ ! -f backend/dist/index.mjs ]; then
  echo "backend/dist/index.mjs missing — building..."
  pnpm install --frozen-lockfile
  pnpm --filter @dulceriacar/backend build
fi

pnpm db:push
pnpm db:seed

exec node --enable-source-maps backend/dist/index.mjs
