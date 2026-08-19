# references

Where the truth behind each rule in `rules/` actually lives. A rule file
names the check; it never restates the reasoning behind it - that lives here
or in the repo doc it points at, so a change to the real convention is the
only place that needs editing.

| Source | Covers |
| --- | --- |
| `pipeline.md` | what `pnpm run doctor` checks, the documentation surface, adding each kind of thing |
| `.claude/skills/sushindustries-conventions/SKILL.md` | file layout, naming, route rules, styling boundaries |
| `apps/web/tests/semantics.test.ts` | the rendered-page contract: headings, landmarks, link graph |
| `apps/web/tests/layout.test.ts` | the geometry contract: overflow, clipping, breakpoints |
| `.claude/skills/toolset/SKILL.md` | "does real content exist at this URL" - the check most rules run first |
| `.claude/skills/sushindustries-conventions/references/01-tanstack-official.md` | the TanStack Start facts rules 07-14 check, with the versions they were verified against |
| `.claude/skills/sushindustries-conventions/references/02-api-drift.md` | where the published docs and the installed types disagree |
| `.claude/skills/sushindustries-conventions/rules/00-gates.md` | what blocks, and which layer catches it |
