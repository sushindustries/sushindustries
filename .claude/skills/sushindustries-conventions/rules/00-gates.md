# 00 - gates

> What blocks. Read this before the topic rule, because a convention is worth
> nothing if a gate below is open.

## Blocking gates

Fix these before anything about style or layout. Each is Official, Safety, or
both - never merely a preference.

| Surface | Block when | Layer |
| --- | --- | --- |
| Loader boundary | a loader reads secrets, the database, the filesystem or a privileged SDK directly | Official + Safety |
| Import protection | it is disabled, its config is overwritten rather than extended, or a privileged file is named so the default glob misses it | Official + Safety |
| Server functions | a mutation's input is not validated at runtime | Official + Safety |
| CSRF | `start.ts` stops putting the CSRF middleware first in `requestMiddleware` | Official + Safety |
| Middleware | a `sendContext` value from the client is trusted server-side without validation | Official + Safety |
| Hydration | the first render differs between server and client without a stabilisation strategy | Official + Safety |
| Route export | a file route does not export its instance as `Route` | Official |
| Generated tree | `routeTree.gen.ts` is hand-edited | Official + Safety |
| Barrels | one `index.ts` re-exports both a `.functions.ts` and a `.server.ts` | Safety |

A validator that only asserts a type is **not** runtime validation.
`(slug: string) => slug` compiles and checks nothing once the request has left
TypeScript. That exact line shipped here and was repaired on 2026-08-19; see
`references/03-current-state.md`.

## The layers, in order

```text
route (URL structure only)
  -> module in apps/web/src/modules/<domain>/<feature>/
     -> <resource>.functions.ts     createServerFn wrappers, safe to import
        -> <resource>.server.ts     secrets, database, filesystem
           -> packages/db           schema + client.server.ts
```

- **Safety:** a route never imports a database client.
- **House:** a route body is a declaration and one call. The second idea goes
  into a module.
- **House:** content that is public, static and identical for every visitor
  comes from `import.meta.glob` at build time, not from RPC.

## Fix without asking

Local, reversible, low-risk. Do it and say so:

- add runtime validation to an unvalidated server-function input
- add a missing `Route` export
- move privileged work behind `createServerFn` or `createServerOnlyFn`
- add a marker import or an explicit server-only boundary
- extend `importProtection` deny rules **without** overwriting existing ones
- run `pnpm run doctor --fix` and commit what it repaired

## Do not do without being asked

- mass route or file renames
- migrating server routes to server functions in bulk
- changing SSR mode across many routes
- database schema edits or migration commands
- turning off a check to make a gate pass

## Common mistakes

| Mistake | Fix |
| --- | --- |
| `const Route = createFileRoute(...)` | `export const Route = ...` |
| treating a loader as server-only | move the privileged half behind `createServerFn` |
| `.validator((x: string) => x)` on a mutation | constrain the value at runtime, then return it |
| `.inputValidator(...)` | `.validator(...)` - see `references/02-api-drift.md` |
| a bare `server.ts` | `<name>.server.ts`, or the default deny glob misses it |
| one barrel over `.functions.ts` and `.server.ts` | split them; the safe half is what gets imported |
| a dynamic segment as `$slug/index.tsx` | keep it a flat `$slug.tsx` |
| hand-editing `routeTree.gen.ts` | change a route file; the plugin regenerates |
| a component styled from `apps/web/src/styles/` | move the rule into `packages/atoms` |

## Done means

- [ ] Every gate above is closed on the touched surface.
- [ ] `pnpm run doctor` passes.
- [ ] `pnpm check` passes before pushing.
- [ ] Anything still enforced by `nobody` was said out loud, not left implied.
