# API drift

- last_verified_at: 2026-08-19
- purpose: record where the published docs and the installed types disagree, so
  a rule here does not overfit a stale example.

Every entry carries the command that settles it. Re-run the command; do not
trust the paragraph.

## `.validator()` is current; `.inputValidator()` is deprecated

**Decision: write `.validator(...)`. Never "fix" one to `.inputValidator(...)`.**

The published server-functions guide writes `.inputValidator(...)`. The
installed types say the opposite, and installed types win. The method appears
to have round-tripped - `.validator()` to `.inputValidator()` and back - with
the docs pages lagging the package.

Verified here on 2026-08-19 against `@tanstack/start-client-core@1.170.24`,
which carries the marker in three places on the `createServerFn` chain:

```ts
validator?: ConstrainValidator<TRegister, TMethod, TInputValidator, TStrict>;
/** @deprecated Use `validator` instead. */
inputValidator?: ConstrainValidator<TRegister, TMethod, TInputValidator, TStrict>;
```

Reproduce without trusting this file:

```bash
find node_modules/.pnpm -path "*start-client-core*/dist/esm/createServerFn.d.ts" \
  | head -1 | xargs grep -n -B2 "inputValidator"
```

Both names still typecheck, so neither breaks the build. That is exactly why
it is written down rather than left to whichever page an agent reads first.

Current call sites here: `1` use of `.validator(`, `0` of `.inputValidator(`.

```bash
grep -rn "\.inputValidator(" apps packages --include=*.ts --include=*.tsx | grep -v node_modules | wc -l
```

Zero passes.

## "Enabled by default" does not mean every server file is covered

**Decision: a privileged file is named `<something>.server.ts`. Never a bare
`server.ts`.**

The default client deny pattern is `**/*.server.*`. That glob needs a segment
**before** `.server.`, so a bare `server.ts` does not match it and is not
protected. The same reasoning applies to a bare `client.ts` under the server
rule.

This is not a documentation error - the docs state the pattern accurately. It
is the gap between what the pattern says and what "server files are protected
by default" is assumed to mean.

**Measured here on 2026-08-19, not assumed.** Two builds, both importing a
module that reads `process.env.DATABASE_URL` from a route component:

| The module was named | Build | Diagnostics |
| --- | --- | --- |
| `server.ts` | **exit 0** | none. The secret reached a client component uncaught |
| `probe.server.ts` | exit 1 | `Denied by file pattern: **/*.server.*` |

So the gap is real in this repo, not only in principle. It is now closed in
`apps/web/vite.config.ts`:

```ts
importProtection: {
	client: {
		files: ["**/*.server.*", "**/server.ts"],
	},
},
```

`files` **replaces** the defaults rather than appending, so `**/*.server.*` is
restated. Dropping it would trade one blind spot for a much larger one. The
same build re-run after the change reports
`Denied by file pattern: **/server.ts`, and the real build still exits 0.

The lasting lesson: a passing build is **weak evidence**. It is equally
consistent with "no violation exists" and "the rule does not match." Confirm a
deny rule works with a deliberate violation before trusting it.

```bash
find apps packages -name "server.ts" -o -name "client.ts" | grep -v node_modules | grep -v dist
```

Empty passes. All ten privileged files use the `<name>.server.ts` form.

## Zod adapters for search params

Zod v4 passes a schema directly to `validateSearch`. Zod v3 needs
`@tanstack/zod-adapter` with `zodValidator` and `fallback`.

Load-bearing here, and resolved correctly. `apps/web` depends on `zod@^4.4.3`
and passes schemas straight in, with no adapter installed:

```bash
grep -rn "validateSearch" apps/web/src --include=*.tsx | grep -v routeTree
```

Three routes, all v4-direct. Note that `zod@3.25.76` also resolves in the
tree as somebody else's transitive dependency - that is not the version
`apps/web` builds against, and it is the sort of thing that makes a version
read off `node_modules` alone misleading. Read the manifest, then the
resolution.

## Flat versus directory routes is not an official position

Router supports flat, directory and mixed structures. Any preference between
them is a local convention and must never be described as official TanStack
behaviour.

This repo's preference, and the reason for it, is in `rules/02-routes.md`:
static segments may become directories, dynamic segments stay flat files
because converting one breaks URL matching.
