# 02 - routes

> `apps/web/src/routes/` is URL structure and nothing else. Everything a route
> knows how to do lives in a module it imports.

## Rules

| Rule | Layer | Enforced by |
| --- | --- | --- |
| Export the route instance as `Route` | Official | `types` |
| Dynamic segments stay flat files, never directories | Official | `nobody` |
| A URL with a dot escapes it as `[.]` | Official | `nobody` |
| Nothing imports from `routes/`; only `router.tsx` imports the route tree | House | `doctor` (`checkRoutesAreLeaves`) |
| Server routes are for HTTP semantics, not internal RPC | House | `nobody` |
| A route body is one call into a module | House | `nobody` |
| Publishing-only pages get no empty `-hooks/` or `-components/` | House | `nobody` |
| Every page renders, and every linked page is in the sitemap | House | `tests` (`semantics.test.ts`) |
| `routeTree.gen.ts` is generated, never hand-edited | Official + Safety | `CI` (it is gitignored) |

## Shape

- Export the route instance as `Route`. Always.
- Static segments may become directories (`packages/index.tsx`).
- **Dynamic segments must stay flat files.** `packages/$slug.tsx`, never
  `packages/$slug/index.tsx`.
- Co-locate with `-components/`, `-hooks/`, `-sections/`. The `-` prefix is
  Router's ignore prefix, so these never become routes.
- Publishing-only pages get no empty `-hooks/` or `-components/` folders.

A route file should read as a declaration of a URL and one call:

```ts
export const Route = createFileRoute("/posts/$slug/index.md")({
	server: {
		handlers: {
			GET: ({ request, params }) =>
				pageMarkdownResponse(request, `/posts/${params.slug}`),
		},
	},
});
```

If a route grows a second idea, the second idea belongs in
`apps/web/src/modules/`. Eight route files that each named one URL and called
one function were collapsed into five on 2026-08-19 for exactly this reason -
the logic was already in a module, so the files were only declarations, and
declarations should be as few as the router allows.

## Route generation

Nothing is run by hand. The `tanstackStart()` plugin in `vite.config.ts` owns
codegen:

| Command | Does |
| --- | --- |
| `pnpm dev` | generates on boot, then regenerates on any add, change or delete under `routes/` |
| `pnpm build` | generates from scratch |

`routeTree.gen.ts` is gitignored, which is why `typecheck` must run after
`build` in `turbo.json` - a clean checkout has no tree until something
generates one.

Do not reach for `@tanstack/router-cli`. It works, but it lags the router
version this repo pins, and the plugin rewrites its output on the next dev or
build anyway. `pnpm exec tanstack` is a different tool entirely - scaffolding
and docs, no route generation.

## Hard-won

### Dynamic segment as a directory breaks the URL

**Rule:** no dynamic segment is nested as `$slug/index.tsx`.

**Why:** converting one breaks URL matching, and the trailing-slash form
redirects to the dead route. Confirmed independently in a second TanStack
Start repo, which lost a live invitation URL to it.

**Check:**

```bash
find apps/web/src/routes -type d -name '$*'
```

Empty passes.

**Last checked:** 2026-08-19 - PASSED.

### A static segment outranks `$slug`, and optional params do not backtrack

**Rule:** a URL like `/components/index.md`, where a literal segment sits
where a `$slug` could match, needs its own **static** route file. It cannot be
served by a parameterised one.

**Why:** `/components/$slug` captures `/components/index.md` with
`slug = "index.md"` before any param route sees it. The obvious fix - one
optional-param route, `/{-$section}/{-$slug}/index.md` - does not work either:
the matcher binds left to right without backtracking, so a two-segment URL
binds `section`, leaves the literal `index.md` for `slug`, and fails. Only a
static segment wins, which is why the Markdown mirrors are one dynamic route
plus four static ones rather than a single clever file.

**Check:** against a running dev server,

```bash
for u in /index.md /components/index.md /components/button/index.md; do
  printf "%s -> " "$u"
  curl -s -o /dev/null -w "%{http_code}\n" -H "Accept: text/html" "http://localhost:3000$u"
done
```

Three 200s pass.

**Last checked:** 2026-08-19 - PASSED, after the single-file version returned
404 for the middle URL.

### Verify a dotted route against the built server

**Rule:** a route whose URL contains a dot is confirmed against
`.output/server/index.mjs`, not against `pnpm dev`.

**Why:** in dev, Vite's static middleware answers a request for a dotted path
with 404 when the `Accept` header is `*/*`, which is what curl sends. The same
URL returns 200 with a document `Accept` header, and always returns 200 on the
built server. A route can look broken in dev and be correct in production.

**Check:**

```bash
pnpm build
cd apps/web && PORT=4173 node .output/server/index.mjs &
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:4173/index.md
```

**Last checked:** 2026-08-19 - PASSED, `200 text/markdown`.

### Read the generated tree with `grep -F`

**Rule:** when checking whether a path survived into `routeTree.gen.ts`, use a
fixed-string match.

**Why:** `$` is a regex metacharacter, so `grep -c "'/components/\$slug'"`
prints `0` for a route that is present and correct - indistinguishable from a
genuinely broken one.

**Check:**

```bash
grep -cF "  '/components/\$slug': typeof" apps/web/src/routeTree.gen.ts
```

Non-zero passes.

**Last checked:** 2026-08-19 - PASSED after the unescaped form reported a
false failure.

### Deleting the generated tree wedges a running dev server

**Rule:** do not delete `routeTree.gen.ts` while `pnpm dev` is running.

**Why:** the watcher regenerates on route-*file* events, not on the generated
file disappearing, and the router imports it - so every request 500s until the
server is restarted. Restart before concluding a route is broken. The sibling
symptom is the same family: after deleting a route file, a running dev server
can keep serving a stale tree.

**Last checked:** 2026-08-19 - reproduced, fixed by restarting.

## Server routes

A server route is for HTTP semantics: a crawler file, a health probe, a
webhook, an endpoint something outside this app calls. Internal app data is a
loader or a server function.

Dots are escaped so the router reads one segment rather than nesting:
`sitemap[.]xml.ts`, `llms[.]txt.ts`, `robots[.]txt.ts`.

`/health` is the deploy probe and checks nothing on purpose.

## Before you finish

- [ ] `Route` is exported.
- [ ] No `$*` directory appeared under `routes/`.
- [ ] A dotted URL was verified against the built server.
- [ ] The route body is a declaration and one call, with the logic in a module.
- [ ] `pnpm test` passes - it walks the sitemap, so a new page is checked as a
      page.
