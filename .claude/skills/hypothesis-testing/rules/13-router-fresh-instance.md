# 13 - router is a fresh instance per call

**Rule:** `getRouter()` in the platform router file creates and returns a
new router instance on every call, never a shared singleton.

**Why:** Official - Start calls this once per request on the server; a
shared singleton leaks one visitor's loader data into the next request's
render.

**Check:** read `apps/web/src/router.tsx` - `createRouter(...)` must be
constructed inside the `getRouter()` function body, not hoisted to module
scope.

**Fix when it fails:** move the `createRouter` call inside `getRouter()`.

**Last checked:** 2026-08-18 - **PASSED**. `getRouter()` builds a fresh
`QueryClient` and a fresh `createRouter` call every invocation, with the
reasoning written directly into the file's own comment.

**Source:** `references/01-tanstack-official-safety.md`.
