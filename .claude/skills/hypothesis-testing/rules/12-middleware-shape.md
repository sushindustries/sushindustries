# 12 - middleware shape and CSRF survival

**Rule:** request-level middleware uses `createMiddleware({ type: "request" })`
(or the bare default), and CSRF middleware stays wired into `createStart`'s
`requestMiddleware` array whenever `src/start.ts` is touched.

**Why:** Official - using the wrong middleware type, or dropping CSRF
protection during an edit to the server entry, is exactly the mistake this
rule exists to block.

**Check:** live, not static - request the site and read its actual response
headers, then read `apps/web/src/start.ts` for the `requestMiddleware` array.

```
curl -sI <base>/ | grep -iE "content-security-policy|referrer-policy"
grep -n "createStart\|createCsrfMiddleware\|requestMiddleware" apps/web/src/start.ts
```

**Fix when it fails:** re-add `createCsrfMiddleware()` to the
`requestMiddleware` array; use `createMiddleware({ type: "request" })` for
request-level concerns, never the function-only form.

**Last checked:** 2026-08-18 - **PASSED, live**. `curl -sI /` actually
returned a real `content-security-policy` and `referrer-policy` header, not
just source code claiming to set one. `start.ts` wires
`requestMiddleware: [csrfMiddleware, withResponseHeaders]`, and
`withResponseHeaders` uses `createMiddleware({ type: "request" })`.

**Source:** `references/01-tanstack-official-safety.md`.
