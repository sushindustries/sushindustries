# 01 - click depth

**Rule:** every page in `/sitemap.xml` is reachable within 3 clicks from
`/`, following only rendered nav/main/footer links (same scope as
`semantics.test.ts`'s link graph - `/preview/`, `/r/`, `/api/`,
`/agent-setup`, `/health` excluded).

**Why:** a page that exists only past 3 clicks or with no incoming link at
all is a page nobody finds by browsing - the site's own philosophy is that
content is discoverable by construction, not by a hand-maintained index.

**Check:**

```
python3 .claude/skills/hypothesis-testing/link_depth.py <base-url> --max-depth 3
```

Empty `beyond_depth` passes. Anything else names the page and its actual
depth or orphan status.

**Fix when it fails:** link the page from within budget - usually its
natural index (`/components`, `/packages`, `/posts`) - rather than lowering
the budget or adding an unrelated shortcut.

**Last checked:** 2026-08-18 - **PASSED** (iteration 2). Fixed by linking
each guide from its own package's README: `packages/assistant/README.md` ->
`/components/assistant`, `packages/react-product-viewer/README.md` ->
`/components/model-mark`. Neither guide belongs in the main install grid (they
are concept guides, not registry items), so the fix was a forward link from
the package that owns them, not an addition to the registry. Record:
`.claude/hypothesis-testing/records/click-depth-budget.md`.
