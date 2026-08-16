---
name: site_stats
summary: How many times a package's page has been read. Use this only when the reader asks about traffic or popularity.
---

# site_stats

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| slug | string | no | A package name. Left out, returns the whole table |

## Returns

A view count per package, and when each was last updated.

## Notes

The one skill backed by a database rather than by the filesystem. Everything
else this assistant can reach is static content inlined at build time; this
reads `package_stats` through Drizzle, which is why it is the skill that can
fail at runtime.

It fails to null rather than throwing. A site whose database is asleep should
still answer questions about its components, and "I do not have those numbers"
is a better reply than a stack trace shaped like an apology.

> [!CAUTION] "Only when the reader asks about traffic"
> Without that clause the model volunteers view counts in answers about how a
> component works, because a number is available and a number looks like
> substance.
