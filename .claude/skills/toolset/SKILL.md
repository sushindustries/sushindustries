---
name: toolset
description: >
  Checks whether a post, page, component or package actually has real content
  at its live URL, not just a source file. Use this skill when:
  (1) you just ran `pnpm new <post|page|component|package>`,
  (2) you just edited a docs file,
  (3) you are asked what's missing on a specific page,
  (4) you are about to call a content-adding task done.
  Never edits code or launches an agent itself - reports in chat, and only
  drafts a scoped fix plan if asked.
---

# toolset

Every component, package, post and page here is content-defined - no index to
update, the site globs the source and renders it. So the failure mode this
catches is specific: **something exists in code with no real page behind it,
or a page with a stub instead of content.** That's the bug, not a style nit.

Fine-grained HTML correctness (heading order, landmarks, layout overflow) is
already `apps/web/tests/`'s job before push. This skill is the earlier, coarser
check: did anything get written at all.

## Run it

```
python3 .claude/skills/toolset/check.py <base-url> <slug>
```

No hardcoded URL table - the script reads `<base-url>/sitemap.xml`, the same
generated, undriftable list `apps/web/tests/` treats as ground truth, and
checks whatever path(s) actually contain `<slug>` there. A slug not in the
sitemap is the finding, full stop - nothing was guessed.

For a docs-file edit, the tab you touched is a search param on that same
matched path (`?tab=guides`), not a separate URL - re-run with the same slug.

## Before running it, ask - don't default

Build (`pnpm build`, run `.output/server/index.mjs`, accurate, slower) or dev
(already on `localhost:3000`, instant, but `pipeline.md` is explicit that dev
markup isn't representative)? Findings from dev get flagged provisional.

## After fetching

- not 200 → that alone is the finding, nothing else here applies
- 200 but stub content → "not documented," report it as such
- genuinely real → say so too; a report that only ever lists failures proves
  nothing was actually checked

## When you're done

Summarize in chat and stop - don't fix anything. Only if asked: propose a
fix scoped to exactly the findings named, get explicit confirmation, then act
or hand it to an agent. A code-writing run is the hard-to-reverse step this
repo's own conventions already say to confirm before taking.
