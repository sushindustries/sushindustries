---
name: site_stats
summary: How many times a page has been read, and when it first appeared. Use this only when the reader asks about traffic or popularity.
---

# site_stats

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| path | string | no | A route path, e.g. `/components/button`. Left out, returns every counted page |

## Returns

Per page: its path, which catalogue it belongs to, the view count, when it was
first opened, and when it was last opened.

## Notes

The one skill backed by a database rather than by the filesystem. Everything
else this assistant can reach is static content inlined at build time; this
reads `page_views` through Drizzle, which is why it is the skill that can fail
at runtime.

It counts pages rather than packages. Components, posts and built pages are
all in the table, so "which components does anyone actually open" is now a
question with an answer - it was not when this counted one catalogue out of
four.

**A page with no row has never been opened.** The table holds what happened,
not what exists: the catalogues are the list of what exists, and duplicating
them here would be a second list to keep in step. So an absent path is not a
missing record, it is the answer.

It fails to null rather than throwing. A site whose database is asleep should
still answer questions about its components, and "I do not have those numbers"
is a better reply than a stack trace shaped like an apology.

> [!CAUTION] "Only when the reader asks about traffic"
> Without that clause the model volunteers view counts in answers about how a
> component works, because a number is available and a number looks like
> substance.
