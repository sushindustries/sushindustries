---
name: sushindustries-mcp
description: Use when answering anything about adamjurek.com's components, its packages, or the libraries it is built on - to look the answer up in one of the three local servers rather than recalling it. Also covers adding a post, page, component or package to that site.
---

# The three servers

Everything this plugin adds is a lookup that costs a file read. None of it
needs the network, a token, or a running service, so there is never a reason
to guess instead.

| Server | Answers | Reads |
| --- | --- | --- |
| `sushindustries` | how a component works, what a package is for | Markdown in the repository |
| `sushindustries` | what a dependency offers, and where it is documented | 9,152 sharded index entries |
| `sushindustries` | what the site publishes, and how to add to it | the live sitemap, and `templates/` |

## Which one, for what

**A question about a component.** `search-docs` if you do not know where it is
written; then `read-doc { slug, section }`. The five sections are the tabs the
site renders, and they divide cleanly: `api` for props and types,
`get-started` for installing and first render, `guides` for composition,
variants, reduced motion and when not to use it, `examples` for the thing
doing a real job, `index` for what it is and why it is built that way.

Read the section, not the page. It is one call and one answer.

**A question about a dependency.** `list-providers`, then `list-sections
{ provider }`, then `find-reference { query, provider, section }`. Narrowing
matters more than phrasing: a bare query searches nine thousand entries.

What comes back is links and one-line descriptions - a map, not the pages.
Fetch the URL when you have it.

**Adding to the site.** `list-slugs` first, because it reads the sitemap the
site generates and is therefore the only answer that cannot be stale. Then
`list-templates`, then the `create-` tool named after the thing.

## The rule that governs the whole thing

Every one of these reads a source that something else already generates.

The component sections are the site's own tabs. The slug list is the site's own
sitemap. The stack shards are each provider's own published index. Nothing here
is a second list maintained by hand, because a second list is a thing that goes
wrong quietly, and the first symptom is an answer that sounds right.

So when a lookup disagrees with what you remember, the lookup wins. And when
two of these disagree with each other, that is a finding worth reporting rather
than a detail to smooth over.

## After writing anything

```bash
pnpm run doctor
```

It fails on a registry entry with no files, a document with no summary, an
export nothing registers, and a class a component uses that no stylesheet
defines. `--fix` repairs what it can; commit the repairs.

## Keeping the indexes honest

```bash
pnpm sushindustries refs --force    # re-fetch every provider index
pnpm sushindustries stack --sync    # rewrite versions from the workspace
```

A stale index is worse than a missing one, because it looks current.
