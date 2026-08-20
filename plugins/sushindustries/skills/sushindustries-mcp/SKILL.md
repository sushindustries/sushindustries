---
name: sushindustries-mcp
description: Use when answering anything about adamjurek.com's components, its packages, or the libraries it is built on - to look the answer up rather than recall it. Also covers adding a post, page, component, collection or package to that site.
---

# One server, four groups

Everything here is a lookup that costs a file read. None of it needs the
network, a token, or a running service, so there is never a reason to guess.

| Group | Answers | Reads |
| --- | --- | --- |
| collections | which documents belong together, and what the set costs | named filters over the index |
| docs | how a component works, what a package is for, what it can look like | Markdown and source in the repository |
| stack | what a dependency offers, and where it is documented | 9,152 sharded index entries |
| authoring | what the site publishes, and how to add to it | the live sitemap, and `templates/` |

A second server, `sushindustries-graph`, serves the same repository as ten
named GraphQL operations over the network. It needs the `apollo-mcp-server`
binary and a token; without either it does not start and the four groups above
still answer everything. Reach for it when you want the graph rather than the
files - element shards, sharding rules, collections with their members.

## Start with collections

`list-collections` before `list-docs`, nearly always.

`list-docs` answers "what is here" with several hundred paths. That is correct
and unusable: a context window spent listing files has none left for reading
them. A collection is somebody's judgement about which of those belong
together, with the token cost of the whole set attached - so "should I read
this" is answerable before paying for it.

`skills`, `conventions`, `component-api` and `the source` are the four to know.
`component-api` is every component's props page and nothing else, which is the
one to load before writing markup against this library.

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
