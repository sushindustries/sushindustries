# references

> Framework facts and audited state. `rules/` says what to do; this says what
> is true, and when it was last checked.

A rule file names a check and the reason behind it. It never restates a
framework API fact, because those change on somebody else's schedule. Those
live here, dated, so a refresh is one file rather than a hunt.

| File | Holds | Refresh when |
| --- | --- | --- |
| `01-tanstack-official.md` | official Start and Router behaviour this repo relies on | Start changes stable guidance, or we move a major version |
| `02-api-drift.md` | where the published docs and the installed types disagree | any Start or Router upgrade |
| `03-current-state.md` | this repo audited against the gates, with evidence | after an architecture change, or when the audit is re-run |

## Source priority

When two sources disagree, this is the order. Do not silently pick the
convenient one - record the conflict with the date and the command that
settles it.

1. **The installed package types**, in this repo's `node_modules`. They are
   what the build actually compiles against.
2. The current canonical guide for that exact API area.
3. The API reference page for that exact symbol.
4. Release notes that explain a rename or a migration.
5. Examples, comparisons and blog posts. Last, always.

Docs pages lag the package. `02-api-drift.md` exists because that has already
cost time here.

## How to refresh

Nothing in here is derived by reading. Every claim carries the command that
proves it, and re-running that command is what a refresh is. If a command
stops proving its claim, the claim is what changes, not the command.
