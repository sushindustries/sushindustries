# 10 - mutation input validation

**Rule:** every server-reachable mutation (POST/PUT/PATCH, server function or
server route) validates its body at runtime before using it.

**Why:** Official + Safety - an unvalidated mutation is attacker-shaped data
one request away from the database.

**Check:** live, not static - the check *is* sending a bad request:

```
curl -X POST <base>/api/feedback -d '{"page":"","vote":"sideways"}' \
  -H "content-type: application/json"
# expect 400, never 500 or a write
```

**Fix when it fails:** add a Zod `.validator(...)`/`safeParse` before the
handler touches the body.

**Last checked:** 2026-08-18 - **PASSED, live**.
`POST /api/feedback` with `{"page":"","vote":"sideways"}` returned
`400 {"error":"Invalid feedback"}`; the same endpoint with a valid body
returned `204`. `apps/web/src/routes/api/feedback.ts` parses with
`feedbackSchema.safeParse` before anything reads the body.

**Source:** `references/01-tanstack-official-safety.md`.
