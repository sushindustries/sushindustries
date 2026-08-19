# 02 - flat dynamic routes

**Rule:** no dynamic route segment under `apps/web/src/routes` is nested as
`$slug/index.tsx`. It stays a flat file: `$slug.tsx`.

**Why:** `sushindustries-conventions` is explicit - converting one breaks
URL matching, and the trailing-slash form of the nested shape redirects to
the dead route.

**Check:**

```
find apps/web/src/routes -type d -name '$*'
```

Empty passes. Any directory listed is a regression.

**Fix when it fails:** flatten it back to `$slug.tsx` and move the nested
`index.tsx`'s content up.

**Last checked:** 2026-08-18 - **PASSED**. No `$*` directories found. Record:
`.claude/hypothesis-testing/records/flat-dynamic-routes.md`.
