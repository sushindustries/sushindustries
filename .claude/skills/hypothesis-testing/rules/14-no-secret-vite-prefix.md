# 14 - no secret behind a VITE_ prefix

**Rule:** no `VITE_*` environment variable holds a secret, token, password,
or service-role key - `VITE_` ships to the client bundle by design.

**Why:** Safety - this is the one env rule that actually matters; everything
else about env handling here is a recorded exception (this repo reads
secrets lazily inside `.server.ts` boundaries rather than through a central
`env.ts` schema, and that's deliberate, not a gap).

**Check:**

```
grep -rn "VITE_" apps/web/src | grep -iE "secret|token|password|service_role|private"
```

Empty passes.

**Fix when it fails:** move the value behind a server-only name, read it
from `.server.ts`, and expose only a derived, non-secret value to the client
if one is needed.

**Last checked:** 2026-08-18 - **PASSED**. The one `VITE_` variable in use,
`VITE_POSTHOG_KEY`, is PostHog's public client key by design, not a secret.

**Source:** `references/01-tanstack-official-safety.md`.
