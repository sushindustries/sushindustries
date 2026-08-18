# 03 - no barrel mixing

**Rule:** no `index.ts` barrel under `apps/web/src` sits in a directory that
also holds both a `*.functions.ts` and a `*.server.ts` file.

**Why:** `sushindustries-conventions` - mixing the two behind one barrel is
how a `.server.ts` (secrets, DB, filesystem) ends up reachable from a
statically-imported barrel a component imports.

**Check:**

```
for f in $(find apps/web/src -name "index.ts"); do
  dir=$(dirname "$f")
  fn=$(ls "$dir" | grep -c '\.functions\.ts$')
  srv=$(ls "$dir" | grep -c '\.server\.ts$')
  [ "$fn" -gt 0 ] && [ "$srv" -gt 0 ] && echo "$f"
done
```

No output passes. Any path printed names a barrel to split.

**Fix when it fails:** split the barrel - one `index.ts` re-exporting the
`.functions.ts` side, the `.server.ts` side importable only from inside a
handler, never through a barrel.

**Last checked:** 2026-08-18 - **PASSED**. No directory had both. Record:
`.claude/hypothesis-testing/records/no-barrel-mixing.md`.
