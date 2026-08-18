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

# Manifests only, so this layer stays cached until a dependency actually
# changes rather than on every source edit.
#
# One COPY per workspace, listed by hand, because Docker flattens a glob like
# `packages/*/package.json` into a single directory and loses the paths that
# pnpm needs to identify each workspace.
#
# Adding a package means adding a line here. It fails loudly if you forget —
# `--frozen-lockfile` sees a workspace in the lockfile with no manifest on
# disk and stops — which is the failure mode worth having.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/atoms/package.json packages/atoms/
COPY packages/ui/package.json packages/ui/
COPY packages/db/package.json packages/db/
COPY packages/llms/package.json packages/llms/
COPY packages/product-viewer/package.json packages/product-viewer/
COPY packages/react-product-viewer/package.json packages/react-product-viewer/

# No BuildKit cache mount here on purpose. Railway's builder requires cache
# mount ids to carry its own cache-key prefix (`s/<service-id>-…`), which would
# hardcode one platform's service id into a Dockerfile that should build
# anywhere. The manifest-only COPY above is what actually saves the time.COPY packages/assistant/package.json packages/assistant/

RUN pnpm install --frozen-lockfile

# ─── build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

# The whole installed tree in one layer, rather than a list of workspaces.
#
# Listing them individually breaks twice over: a package with no dependencies
# never gets a `node_modules` at all, so `COPY` fails on a path that does not
# exist (`packages/atoms` is exactly that — one CSS file, no deps), and every
# new package would need a line here or resolve to nothing at build time.
#
# The source is copied second. `.dockerignore` excludes node_modules from the
# build context, so this adds the source without disturbing what was installed.
COPY --from=deps /app /app
COPY . .

# Turbo, not a single filter. The viewer packages publish `dist/`, which only
# exists after their own build runs, and `dependsOn: ["^build"]` is what
# guarantees that happens before the app that imports them. Building only the
# app succeeded locally purely because a previous manual build had left `dist`
# behind.

# Vite inlines `VITE_*` variables at build time, so the analytics key and the
# relay path have to exist *here*, not just at runtime. Railway passes service
# variables to Docker builds as build args - but only for names the Dockerfile
# declares. The key is public by design (it can only write events); absent
# args build a site that simply measures nothing.
ARG VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST

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
