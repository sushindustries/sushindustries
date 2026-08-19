# Agent instructions

This project's conventions live in [`CLAUDE.md`](./CLAUDE.md) - read that
first. This file exists because some agents look for `AGENTS.md`
specifically and would otherwise find nothing; it is a pointer, not a
second copy, because two files saying the same thing is one of them
quietly going stale.

The short version, if you read nothing else:

- `.claude/skills/sushindustries-conventions/SKILL.md` is the layout and
  naming authority - read it before adding a file.
- `.claude/pipeline.md` explains how a post, component or package gets
  added, and what checks it.
- Every visible element of the site is a component in `packages/ui`. If
  you are building something for a page, it almost certainly belongs
  there instead.
- `pnpm check` is what the pre-push hook runs: doctor, lint, types,
  build. Run it before you consider anything done.
