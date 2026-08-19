# 15 - no dead exports

**Rule:** no exported function in `apps/web/src/modules` is called from
nowhere - not from another file, not from its own.

**Why:** dead code is a maintenance cost with zero payoff - every reader has
to work out it does nothing, every refactor has to consider it, and it never
once earns that back. This repo's own stated preference is against
premature abstraction generally; an abstraction nobody calls is the extreme
case.

**Check:**

```
python3 .claude/skills/hypothesis-testing/dead_exports.py apps/web/src/modules
```

This is a text-grep heuristic, not a type-aware tool - it flags every
export a plain word-search can't find used elsewhere, which includes
legitimate cases (a type/const used only within its own file, where the
`export` keyword itself is the only unnecessary part). **Hand-verify every
function-level hit before removing anything** - grep the exact name across
the repo yourself; do not trust the script's list as a verdict.

**Fix when it fails:** delete the function, then check for imports that
were only there to support it - an unused import is the second-order dead
code the first removal creates.

**Last checked:** 2026-08-18 - **FAILED, then fixed**. 4 of 39 raw hits were
real (`listComponentPages`, `listDesks`, `breadcrumbs`, `componentCrumbs`) -
removed, along with the imports and interface that existed only for them.
`tsc --noEmit` and `biome check` both clean; re-verified live against the
running dev server. The other 35 hits were exported types/consts genuinely
used within their own file - an export-keyword nit, not dead code, and not
acted on here.
