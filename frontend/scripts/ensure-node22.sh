#!/usr/bin/env bash
# Runs before vite build on Railway (Nixpacks defaults to Node 18).
set -euo pipefail

major="$(node -p "process.version.slice(1).split('.')[0]")"

if [ "$major" -ge 20 ]; then
  exit 0
fi

echo "Node $(node -v) is too old for Vite 7 — upgrading to Node 22..."

npm install -g n
n 22
hash -r 2>/dev/null || true

echo "Now using Node $(node -v)"

# Reinstall deps so native modules (e.g. @tailwindcss/oxide) match Node 22.
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$repo_root"
rm -rf node_modules frontend/node_modules backend/node_modules packages/*/node_modules 2>/dev/null || true
corepack enable 2>/dev/null || true
corepack prepare pnpm@9.15.9 --activate 2>/dev/null || true
pnpm install --frozen-lockfile

echo "Dependencies reinstalled with Node $(node -v)"
