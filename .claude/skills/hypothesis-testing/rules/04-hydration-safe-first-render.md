# 04 - hydration-safe first render

**Rule:** no component in `packages/ui` or `apps/web/src` renders
`Date.now()`, `Math.random()`, or a locale-dependent value directly into its
first render output without going through `ClientOnly` or a value stabilized
on the server (loader data, a cookie-backed value).

**Why:** `tanstack-start-architecture`'s ssr-hydration rules classify this
Official/Safety - if server and client can render differently on the first
pass, that's a design problem, not a harmless warning. This tier applies
here in full per this repo's own CLAUDE.md; only its Project-convention tier
is superseded by `sushindustries-conventions`.

**Check:**

```
grep -rn "Date\.now()\|Math\.random()" --include="*.tsx" packages/ui/src apps/web/src
```

No output passes.

**Fix when it fails:** move the unstable value into a loader (compute once
on the server, hydrate from loader data) or wrap the widget in `ClientOnly`
- never disable SSR wholesale to route around it.

**Last checked:** 2026-08-18 - **PASSED**. No matches.
Record: `.claude/hypothesis-testing/records/hydration-safe-first-render.md`.
