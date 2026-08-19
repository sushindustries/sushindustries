---
description: Look something up in the dependency indexes before writing code against it
---

Find out what a dependency actually offers, from the copy of its documentation
index kept in this repository. Nine thousand entries across thirty-five
providers, all local, so checking costs nothing and is always cheaper than
guessing an API that may have moved.

The subject is: $ARGUMENTS

Work in this order, and stop as soon as you have the page:

1. `list-providers` if you do not know which provider owns the subject. It
   folds each library under the site that publishes it, so TanStack's eleven
   indexes read as one entry.
2. `list-sections { provider }` to see how that provider divides its
   documentation. This reads the manifest only, so it is free.
3. `find-reference { query, provider, section }`. A bare query searches all
   nine thousand entries and will bury the answer; the provider and section
   arguments are the difference between one result and forty.

What comes back is links, titles and each provider's own one-line
descriptions. It is a map, not the pages. When you have the URL, fetch it.

If a provider looks stale, or a dependency was upgraded recently:

```bash
pnpm sushindustries refs --force
```
