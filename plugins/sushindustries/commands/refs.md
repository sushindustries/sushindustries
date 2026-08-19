---
description: Refresh the local copy of every dependency's documentation index
---

Re-fetch each provider's `llms.txt` and cut it back into shards.

```bash
pnpm sushindustries refs           # keeps what is already there
pnpm sushindustries refs --force   # re-fetches everything
```

Do it when a dependency is upgraded. A stale index is worse than none, because
it looks current and sends you to a page that quietly moved.

$ARGUMENTS

Afterwards, `pnpm sushindustries stack --sync` rewrites the version on each
entry from what the workspace actually declares, so the table cannot claim a
version nobody is running.

What is stored is links, titles, section names and each provider's own
one-line descriptions, taken from the machine-readable index they publish for
exactly this purpose. Never page content. That boundary is deliberate and
should stay where it is: it is what makes this a citation rather than a copy.
