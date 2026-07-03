# Monorepo backend — build context must be repository root.
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/packages ./packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY backend ./backend
RUN pnpm --filter @dulceriacar/backend build

FROM base AS runner
WORKDIR /app
COPY --from=build /app .
ENV NODE_ENV=production
EXPOSE 8080
CMD ["sh", "-c", "pnpm db:push && pnpm db:seed && node --enable-source-maps backend/dist/index.mjs"]
