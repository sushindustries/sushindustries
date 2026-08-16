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
COPY packages/product-viewer/package.json packages/product-viewer/
COPY packages/react-product-viewer/package.json packages/react-product-viewer/

# No BuildKit cache mount here on purpose. Railway's builder requires cache
# mount ids to carry its own cache-key prefix (`s/<service-id>-…`), which would
# hardcode one platform's service id into a Dockerfile that should build
# anywhere. The manifest-only COPY above is what actually saves the time.
RUN pnpm install --frozen-lockfile

# ─── build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

# Every workspace's node_modules, not a hand-picked few. pnpm links workspace
# packages through these directories, so a package whose tree is missing
# resolves to nothing — and the error names the importer, not the package that
# was skipped, which sends you looking in the wrong file.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/atoms/node_modules ./packages/atoms/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/product-viewer/node_modules ./packages/product-viewer/node_modules
COPY --from=deps /app/packages/react-product-viewer/node_modules ./packages/react-product-viewer/node_modules
COPY . .

# Turbo, not a single filter. The viewer packages publish `dist/`, which only
# exists after their own build runs, and `dependsOn: ["^build"]` is what
# guarantees that happens before the app that imports them. Building only the
# app succeeded locally purely because a previous manual build had left `dist`
# behind.
RUN pnpm build

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
