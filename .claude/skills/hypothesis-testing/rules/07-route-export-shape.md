# 07 - route export shape

**Rule:** every file route exports its route instance as `Route`
(`export const Route = createFileRoute(...)`), never an unexported binding.

**Why:** Official TanStack Start requirement - the router plugin and
`routeTree.gen.ts` generation both depend on finding that export.

**Check:**

```
grep -rn "= createFileRoute" apps/web/src/routes --include="*.ts" --include="*.tsx" \
  | grep -v "export const Route ="
```

Empty passes.

**Fix when it fails:** add the missing `export`.

**Last checked:** 2026-08-18 - **PASSED**. Zero violations across every
route file. Confirmed live too: every one of the 95 sitemap paths returns
200 (`.claude/skills/hypothesis-testing/link_depth.py` output), which a
missing export would have broken at build time.

**Source:** `references/01-tanstack-official-safety.md`.
