# syntax=docker/dockerfile:1

# Multi-stage so the image that runs is not the image that built.
#
# The build stage needs pnpm, the whole workspace and every devDependency;
# the runtime stage needs Node, the server bundle and the production
# dependencies it did not inline. Keeping them apart is what stops a
# ~1GB toolchain from riding along into production.

# ─── deps ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable

# Only the manifests, so this layer is cached until a dependency actually
# changes. Copying the source here would invalidate it on every edit.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/atoms/package.json packages/atoms/
COPY packages/ui/package.json packages/ui/
COPY packages/db/package.json packages/db/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# ─── build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY . .

RUN pnpm --filter @sushindustries/web build

# ─── runtime ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Nitro's node-server output is self-contained: it bundles its own
# dependencies, so no second install is needed here.
COPY --from=build /app/apps/web/.output ./.output

# Railway sets PORT; the Nitro server reads it. The EXPOSE is documentation.
EXPOSE 3000

# Don't run as root.
USER node

CMD ["node", ".output/server/index.mjs"]
