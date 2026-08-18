# 06 - typeof window branching (out of scope here)

**Rule under test:** "manual `typeof window` branching should use
`createClientOnlyFn`/`createServerOnlyFn`/`createIsomorphicFn` instead."

**Why this isn't PASSED/FAILED:** `tanstack-start-architecture` classifies
this row under Execution Model's **Project convention** tier ("prefer
environment functions over ad-hoc branching"), not Official or Safety. This
repo's own CLAUDE.md is explicit: the global skill's Project-convention
layer describes a different repo, and `sushindustries-conventions` is the
authority here - which does not forbid `typeof window`. Applying a foreign
repo's style preference would be enforcing a rule that was never adopted.

**Check (for visibility, not enforcement):**

```
grep -rln "typeof window" --include="*.ts" --include="*.tsx" packages/ui/src apps/web/src
```

**Result:** **INCONCLUSIVE by design** - three real hits
(`packages/ui/src/use-device-kind.ts`,
`apps/web/src/modules/chrome/shelf-actions.ts`,
`apps/web/src/modules/showcase/paced-import.ts`), none of them a violation of
anything this repo actually enforces. Recorded so the next run doesn't
re-litigate the tier question from scratch.
Record: `.claude/hypothesis-testing/records/window-branching-tier.md`.
