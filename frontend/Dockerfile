# Monorepo frontend — build context must be repository root.
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/packages ./packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY frontend ./frontend
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm --filter @dulceriacar/frontend build

FROM node:22-alpine AS runner
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/frontend/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "serve dist -s -l ${PORT}"]
