# sushindustries

A TanStack Start site and the packages it is built from. One person's work, so
write copy in the first person singular — never "we", "our team", or "us".

## Read first

- `.claude/skills/sushindustries-conventions/SKILL.md` — the layout and naming
  rules this repo actually enforces. Read it before adding a file.
- The global `tanstack-start-architecture` skill — Official and Safety layers
  apply here in full. Its "Project convention" layer describes a different
  repo; the skill above is this repo's convention authority and outranks it.

## Shape

```text
apps/web/          the site. TanStack Start on Vite + Nitro.
packages/atoms/    design tokens + atomic CSS. No build step.
packages/ui/       the components the site is made of. All installable.
packages/db/       Drizzle schema + client. Postgres.
```

The rule that holds it together: **every visible element of the site is a
component in `packages/ui`.** The site is the first consumer of the library,
not a special case of it. If something is being built for a page, ask whether
it belongs in `ui` first — the answer is usually yes, and "it needs a prop for
that" is the fix, not a reason to keep it in the app.

Only genuinely site-specific things stay in `apps/web/src/modules/`: the nav,
the footer, the logo, the package catalogue.

## Commands

```bash
pnpm dev          # http://localhost:3000
pnpm build        # every package, then the site
pnpm typecheck
```

## Adding a package

Create `packages/<name>/` with a `package.json` and a `README.md`. That is the
whole procedure — the site globs `packages/*` at build time, so it appears at
`/packages/<name>` with its README rendered. There is no list to update.

## Deploy

Railway builds the root `Dockerfile` and runs the Nitro node server.
`/health` is the probe and checks nothing on purpose.
