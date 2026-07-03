#!/usr/bin/env bash
# Railway/Nixpacks may install Node 18 by default. Vite 7 needs Node 20.19+.
set -euo pipefail

need_node_upgrade() {
  node -e "process.exit(Number(process.version.slice(1).split('.')[0]) >= 20 ? 0 : 1)"
}

if ! need_node_upgrade; then
  echo "Current Node: $(node -v) — installing Node 22..."
  npm install -g n
  n 22
  hash -r
  echo "Using Node: $(node -v)"
fi

cd "$(dirname "$0")/.."

if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@9.15.9 --activate
fi

pnpm install --frozen-lockfile
pnpm --filter @dulceriacar/frontend build
