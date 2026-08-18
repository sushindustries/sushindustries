# 05 - no duplicate server route methods

**Rule:** no two server route files resolve to the same path with the same
HTTP method (e.g. a `foo.ts` and a `foo.index.ts` both handling `GET`).

**Why:** `tanstack-start-architecture`'s server-routes rules classify
colliding path+method handlers Official - blocked, not a style nit.

**Check:**

```
grep -rl "server:" apps/web/src/routes --include="*.ts" --include="*.tsx" \
  | xargs -I{} sh -c 'grep -oE "^\s*(GET|POST|PUT|PATCH|DELETE):" {} | tr -d " :" | sort -u | sed "s|^|{} -> |"'
```

Every file's resolved path should be unique; no output passes.

**Fix when it fails:** merge the handlers into one file, or rename one route
so the two no longer resolve to the same path.

**Last checked:** 2026-08-18 - **PASSED**. 21 server route files, each a
distinct resolved path, no method collisions.
Record: `.claude/hypothesis-testing/records/no-duplicate-server-route-methods.md`.
