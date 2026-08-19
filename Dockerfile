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
COPY packages/assistant/package.json packages/assistant/
COPY packages/http/package.json packages/http/
COPY packages/cli/package.json packages/cli/

# No BuildKit cache mount here on purpose. Railway's builder requires cache
# mount ids to carry its own cache-key prefix (`s/<service-id>-…`), which would
# hardcode one platform's service id into a Dockerfile that should build
# anywhere. The manifest-only COPY above is what actually saves the time.

RUN pnpm install --frozen-lockfile

# ─── build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Vite inlines `VITE_*` variables at build time and Nitro bakes the /ingest
# relay's target into its route rules, so all three have to exist *here*, not
# just at runtime. Railway passes service variables to Docker builds only for
# names the Dockerfile opts into with ARG - declared at the top of the stage,
# which is the position their documentation's example uses. The key is public
# by design (it can only write events); absent args build a site that simply
# measures nothing.
ARG VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST
ARG POSTHOG_HOST
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST
ENV POSTHOG_HOST=$POSTHOG_HOST

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

# The one-line proof in every build log of whether the args arrived - "set"
# or "unset", never the values.
RUN echo "posthog build args: key=${VITE_POSTHOG_KEY:+set} relay=${VITE_POSTHOG_HOST:+set} host=${POSTHOG_HOST:+set}"

RUN pnpm build

# ─── runtime ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Nitro's node-server output is self-contained: it bundles its own
# dependencies, so no second install is needed here.
COPY --from=build /app/apps/web/.output ./.output

# The migration runner and the SQL it applies, for the pre-deploy command in
# `railway.json`. Both are needed because that command runs in a container
# built from this image with no `node_modules` to resolve against - which is
# why `migrate.mjs` is bundled with its driver rather than importing one.
# Sixty kilobytes of program and sixty of SQL, against a schema change
# arriving on its own.
COPY --from=build /app/packages/db/dist/migrate.mjs ./migrate.mjs
COPY --from=build /app/packages/db/drizzle ./drizzle

# Railway sets PORT; the Nitro server reads it. The EXPOSE is documentation.
EXPOSE 3000

# Don't run as root.
USER node

# `/health` already exists as the deploy probe and checks nothing on purpose -
# it answers when the server can answer, which is the only thing a liveness
# check should ask. Declaring it here makes the image say so itself, so
# anything that runs the container knows how to ask without being told.
#
# `node -e` rather than curl or wget: node 22 has global fetch and is
# guaranteed present, while curl is not installed in the alpine base and
# adding it would mean a package manager in the runtime image.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
	CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", ".output/server/index.mjs"]
