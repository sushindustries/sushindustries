# 09 - server function validator API

**Rule:** `createServerFn` chains use `.validator(...)`, not the deprecated
`.inputValidator(...)` alias.

**Why:** Official + drift note - the published Start docs still show
`.inputValidator(...)`, but the installed `@tanstack/react-start` (1.168.46,
via `start-client-core` 1.170.24) marks it `@deprecated Use validator
instead` right in the type definitions - verified by reading the `.d.ts`
directly, not just asserting it.

**Check:**

```
grep -rn "\.inputValidator(" apps/web/src --include="*.ts" --include="*.tsx"
```

Empty passes.

**Fix when it fails:** rename `.inputValidator(` to `.validator(` - the
signature is identical, so it's a mechanical rename, not a behavior change.

**Last checked:** 2026-08-18 - **FAILED, then fixed**.
`apps/web/src/modules/stats/stats.functions.ts:21` used
`.inputValidator((slug: string) => slug)`. Renamed to `.validator(...)`,
`pnpm exec tsc --noEmit` passed clean, and the fix was exercised live against
the running dev server: `POST /api/feedback` (a different validator, same
API) still returns 400 on a bad body and 204 on a good one, and
`GET /packages/ui` (the route that actually calls the fixed function) still
renders 200 with no server error. Record:
`.claude/hypothesis-testing/records/server-fn-validator-api.md`.

**Source:** `.claude/skills/sushindustries-conventions/references/01-tanstack-official.md`.
