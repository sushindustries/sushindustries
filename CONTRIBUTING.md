# Contributing

This is one person's repository - the site is my portfolio and the packages
are its parts. It exists to be read, installed, and taken from, which means
contributions are welcome but the bar for what merges is "I would have
written this myself".

## What is genuinely welcome

- **Bug reports.** A component that breaks, a page that renders wrong, an
  install door that fails. An issue with reproduction steps beats a PR that
  guesses at the fix.
- **Small, surgical PRs.** A real bug fixed in the file it lives in.
- **Corrections to anything false.** A README that lies, a doc that drifted.

Anything bigger than that - a new prop, a changed signature, anything that
touches more than one file - open an issue first. A PR is the wrong place to
find out the approach was wrong.

## What will probably be declined

- New components, new packages, new dependencies. The library is what I use;
  it grows when the site needs something, not when a PR offers it.
- Refactors, restyles, and rewrites of working code.
- Anything a formatter or linter did not ask for.

## AI-assisted contributions

I use AI tools on this repository myself, so I am not going to pretend
nobody else does. Use them if you want. What I am asking for is the same bar
I hold my own commits to: read what the tool wrote before you send it, keep
the technical decisions yours, and do not paste raw model output into an
issue or PR description as though you wrote it. A PR I cannot get a straight
answer about in review gets closed, tool-assisted or not.

## Before you push

```bash
pnpm check   # doctor, lint, types, build - the pre-push hook runs this too
```

The layout and naming rules live in
`.claude/skills/sushindustries-conventions/SKILL.md` and they are enforced,
not aspirational. Two visible ones: no em dashes anywhere, and every visible
element of the site is a component in `packages/ui`.

By contributing you agree your contribution is licensed under the same MIT
licence that covers the repository.
