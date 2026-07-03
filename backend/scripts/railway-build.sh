#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm db:push
pnpm db:seed
pnpm --filter @dulceriacar/backend build
