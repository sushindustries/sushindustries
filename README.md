# sushindustries

My portfolio, and the packages it is built from.

The site is the first consumer of its own component library - every element you
can see on it ships in `@sushindustries/ui`, so anything you like on the page is
something you can install.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Shape

```text
apps/web/          the site. TanStack Start on Vite + Nitro.
packages/atoms/    design tokens + atomic CSS. No build step.
packages/ui/       the components the site is made of. All installable.
packages/db/       Drizzle schema + client. Postgres.
```

## Stack

| | |
| --- | --- |
| [TanStack Start](https://tanstack.com/start) | SSR, server functions, file routes |
| [TanStack Markdown](https://tanstack.com/markdown) | renders each package's README |
| [TanStack Highlight](https://tanstack.com/highlight) | syntax highlighting, synchronous, no client JS |
| [Nitro](https://nitro.build) | builds the Node server that Railway runs |
| [Drizzle](https://orm.drizzle.team) | Postgres schema and queries |
| [Lenis](https://lenis.darkroom.engineering) | smooth scroll |
| [Turborepo](https://turborepo.com) + pnpm | the workspace |

No CSS framework and no component library. `packages/atoms` is ~300 lines of
hand-written CSS, served as-is.

## Using this as a template

It is meant to be reused. The parts worth taking:

- **A component library that cannot rot.** The site imports `packages/ui` the
  same way a stranger would. There is no private path into it, so a component
  that breaks for you broke for me first.
- **Docs that cannot drift.** `/packages/<name>` is generated from that
  package's own `package.json` and `README.md` via `import.meta.glob` at build
  time. Adding a package is creating a directory - there is no index to update
  and nothing to keep in sync.
- **A server boundary you can see.** `packages/db` has two entry points:
  `schema` (types, safe anywhere) and `client.server.ts` (the connection). The
  `.server.ts` suffix is in TanStack Start's default client deny list, so
  importing it from the browser is a build error rather than a review comment.
- **Conventions written down.** `.claude/skills/sushindustries-conventions/`
  holds the layout and naming rules, so an agent working in the repo reads them
  instead of guessing.

To strip it back to a starter: delete `packages/db` if you have no database,
empty `packages/ui/src` down to `Section` and `Card`, and replace
`apps/web/src/modules/chrome/`.

## Adding a package

```bash
mkdir -p packages/my-thing
```

Give it a `package.json` (with `name`, `version`, `description`) and a
`README.md`. It appears at `/packages/my-thing` on the next build, README
rendered and code highlighted. Mark it `"private": true` to keep it out.

## Deploy

Railway builds the root `Dockerfile` and runs `node .output/server/index.mjs`.
`/health` is the probe and deliberately checks nothing - a health check that
pings the database turns a slow query into a restart loop.

`DATABASE_URL` is the only environment variable, and only the parts that touch
`packages/db` need it.

## Checks

```bash
pnpm build
pnpm typecheck
pnpm exec biome check .
```
