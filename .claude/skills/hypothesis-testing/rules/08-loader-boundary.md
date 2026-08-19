# 08 - loader boundary

**Rule:** no route `loader` imports `@sushindustries/db` or a `.server.ts`
module directly. Loaders are isomorphic; privileged access goes through a
`createServerFn` wrapper instead.

**Why:** Official + Safety - a loader runs on server and client both, so a
direct DB/secret import in one would ship a Postgres driver (or a secret) to
the browser bundle.

**Check:**

```
grep -rl "loader:" apps/web/src/routes --include="*.tsx" \
  | xargs grep -l '@sushindustries/db\|\.server"'
```

Empty passes.

**Fix when it fails:** move the access into a `.server.ts` helper, wrap it
in a `.functions.ts` `createServerFn`, and have the loader call the wrapper.

**Last checked:** 2026-08-18 - **PASSED**. Zero loaders touch `db` or
`.server.ts` directly. The one place this repo does need the database
(`apps/web/src/routes/packages/$slug.tsx`) goes through
`stats.functions.ts` -> `stats.server.ts`, exactly the intended shape.

**Source:** `.claude/skills/sushindustries-conventions/references/01-tanstack-official.md`.
