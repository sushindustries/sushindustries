# Current state

- audited_at: 2026-08-19
- audited_against: `rules/00-gates.md`, every gate, whole repo
- result: **all gates closed.** Two were open when the audit started and were
  fixed during it.

Evidence is the command, not this paragraph. Re-run them.

## What this repo is

One Start app and five compiling packages.

| | |
| --- | --- |
| App | `apps/web` - TanStack Start on Vite + Nitro, deployed to Railway |
| Route root | `apps/web/src/routes`, the default. `tanstackStart()` does not override `srcDirectory` or `routesDirectory` |
| Server entry | `apps/web/src/start.ts` - `createStart`, two request middleware |
| Packages | `ui`, `atoms`, `db`, `llms`, `assistant`, plus the two viewers |
| Versions | see `01-tanstack-official.md` |

Server functions are deliberately rare: two. Everything else the site renders
is public, static and identical for every visitor, so it comes from
`import.meta.glob` at build time rather than from RPC.

| Function | Method | Input |
| --- | --- | --- |
| `getTheme` | GET | none |
| `countPackageView` | POST | a package slug, charset and length constrained |

Server routes, all with HTTP justification: `/health` (deploy probe),
`/api/feedback` and `/api/chat`, the crawler files (`robots.txt`,
`sitemap.xml`, the shards, `llms*.txt`), the Markdown mirrors, and `/r/*`
(the registry an installer reads).

## The gates, one by one

| Gate | Result | Evidence |
| --- | --- | --- |
| Loader boundary | PASS | no loader imports a `.server` module; the only route touching the database is `api/feedback.ts`, a server route, and it imports the client dynamically inside its handler |
| Import protection | **FIXED** | see below |
| Server function validation | **FIXED** | see below |
| CSRF | PASS | `requestMiddleware: [csrfMiddleware, withResponseHeaders]` - CSRF first |
| `sendContext` | PASS | zero uses, so nothing client-supplied is trusted server-side |
| Hydration | PASS | three date and random patterns, all stabilised - see below |
| Route export | PASS | every file route exports `Route` |
| Generated tree | PASS | `routeTree.gen.ts` is gitignored, so it cannot be hand-edited into a commit |
| Mixed barrels | PASS | no `index.ts` re-exports both a `.functions.ts` and a `.server.ts` |

## Fixed during this audit

### The import-protection blind spot was real here

The default client deny pattern `**/*.server.*` needs a segment before
`.server.`, so a file named plainly `server.ts` matched nothing. Proven with
two builds rather than argued: a module reading `process.env.DATABASE_URL`,
imported from a route component, **built clean with zero diagnostics** when
named `server.ts`, and failed the build when named `probe.server.ts`.

No such file existed - all ten privileged modules already used the
`<name>.server.ts` form - so nothing had leaked. The hole was in what would
happen next. `apps/web/vite.config.ts` now denies `**/server.ts` alongside the
restated default, and the same experiment re-run reports
`Denied by file pattern: **/server.ts`.

Full write-up, including why `files` replaces rather than appends, is in
`02-api-drift.md`.

### A mutation validated nothing at runtime

`countPackageView` is a POST that writes a row keyed by whatever it is handed,
into a `text` column with no length bound. Its validator was
`(slug: string) => slug` - a type assertion that checks nothing once the
request has left TypeScript. Any same-origin page could have written arbitrary
rows.

It now constrains the value to the shape a package slug actually has,
`^[a-z][a-z0-9-]{0,63}$`, and throws otherwise. CSRF middleware already kept
this cross-origin; this closes the same-origin half.

## Hydration, verified rather than assumed

Three patterns exist and all three are correct, which is worth recording
because the fix differs each time:

| Where | Pattern | Why it is safe |
| --- | --- | --- |
| `doc-actions.tsx` | `toLocaleDateString("en-US", { timeZone: "UTC" })` | both locale and time zone pinned. Pinning only the locale would not be enough |
| `packages/ui/src/clock.tsx` | `useState<string \| null>(null)`, `new Date()` inside `useEffect` | first render is the placeholder on both sides; the clock starts after mount |
| `doc-feedback.tsx` | `new Date()` and `safeRandomUUID()` in a click handler | never runs during render |

## Open

Nothing blocking. One thing worth knowing:

- Everything in `rules/06-motion.md` is enforced by `nobody`. Reduced motion,
  hydration-stable first render and frame-callback animation are invisible to
  every gate and obvious to a visitor. The audit above checked hydration by
  hand; the other two were not mechanically checked and cannot be today.

## Re-running this

```bash
pnpm run doctor        # structure, in seconds
pnpm check             # doctor, lint, types, build, tests
```

Then the gates that no script covers: the greps in `02-api-drift.md`, and the
deliberate-violation build described above. A passing build proves a rule
matched something only if something was there to match.
