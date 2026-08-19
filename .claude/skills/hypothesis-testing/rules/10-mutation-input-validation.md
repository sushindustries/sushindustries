# 10 - mutation input validation

**Rule:** every server-reachable mutation (POST/PUT/PATCH, server function or
server route) validates its body at runtime before using it.

**Why:** Official + Safety - an unvalidated mutation is attacker-shaped data
one request away from the database.

**Check:** enumerate first, then probe. Probing the endpoint you remember is
how this rule passed while a mutation was unguarded.

```
# 1. every mutation surface, listed rather than recalled
grep -rn 'createServerFn({ method: "POST"' apps/web/src --include=*.ts
grep -rln 'POST:\|PUT:\|PATCH:' apps/web/src/routes --include=*.ts

# 2. a validator that only asserts a type is not validation. Any body that
#    hands its argument straight back is a compile-time claim, not a check.
grep -rn -A2 '\.validator(' apps/web/src --include=*.ts

# 3. then send each surface a bad body: expect 4xx, never 500 and never a write
curl -X POST <base>/api/feedback -d '{"page":"","vote":"sideways"}' \
  -H "content-type: application/json"
```

**Fix when it fails:** constrain the value at runtime and throw otherwise -
charset and length for an identifier, a Zod `safeParse` for a body.

**Last checked:** 2026-08-19 - **FAILED, then fixed.**

The 2026-08-18 **PASSED** was false confidence, and the defect was in this
file rather than in the code: step 1 did not exist, so the check probed
`/api/feedback` and concluded the rule held everywhere. It holds there -
`feedbackSchema.safeParse` runs before anything reads the body, and a bad
body still returns `400 {"error":"Invalid feedback"}`.

The surface it never looked at was `countPackageView`, a `POST` server
function that writes a row keyed by its own input into an unbounded `text`
column. Its validator was `(slug: string) => slug` - which compiles, reads
like validation, and checks nothing once the request has left TypeScript. Any
same-origin page could have written arbitrary rows. It now constrains the
value to `^[a-z][a-z0-9-]{0,63}$` and throws otherwise.

The lesson worth keeping: a check whose scope is narrower than its rule's
scope reports a pass for the part it looked at and gets read as a pass for the
whole rule.

**Source:** `.claude/skills/sushindustries-conventions/rules/00-gates.md` and
`references/01-tanstack-official.md` in that skill.
