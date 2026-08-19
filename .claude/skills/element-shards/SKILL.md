---
name: element-shards
description: How to fetch part of an element instead of all of it - the addressing scheme, what a shard is, and how to keep it correct when you add or change one.
---

# Element shards

> Read this before fetching documentation for a component. The whole element
> is usually four to six thousand tokens; the answer you want is usually four
> hundred.

## The one number that matters

`nav-bar` is 6,275 tokens. Its `api` section is 430.

Loading the element to find out what props it takes costs fourteen times what
the answer costs. That ratio is the entire reason this exists, and it is why
every shard reports its own price before you fetch it.

## The address

```text
/{name}/{version}/{facet}[/{section}]

/nav-bar/0.1.0/docs/api
/nav-bar/0.1.0/source
/folder-shelf/0.1.0/parts
```

**The version is not decoration.** A copied component has no lockfile entry -
that is the point of a registry you install *from* rather than depend *on* -
so an element's own `version` is the only thing a consumer can ever cite about
what they took. Omitting it resolves to whatever is current, which is
convenient and is the form to avoid pinning against.

A wrong version returns nothing rather than the current one. Silently serving
a different version to somebody who asked for a specific one is the failure
this refuses to have.

## The four facets

| Facet | Holds | Has sections |
| --- | --- | --- |
| `docs` | One documentation section | yes: `index`, `get-started`, `guides`, `api`, `examples` |
| `source` | Every file installing it copies | no |
| `deps` | npm packages and other elements | no |
| `variants` | The values its props switch between | no |

`docs` is the only facet with sections, because it is the only one somebody
asks a part of.

## What makes something a shard

**A shard is the piece you would want to fetch on its own.**

That is the same rule the reference indexes are cut by, and it decides the
cases that look arbitrary:

- **Not one shard per file.** `nav-bar` copies four files and they are useless
  apart - installing three of them is a broken component. `source` is one
  shard however many files it holds.
- **One shard per docs section**, because "what props does this take" is `api`
  and none of the other four.
- **`deps` and `variants` are shards** even though they are small, because
  each is a question somebody asks without the others.

The unit is the question, not the file.

## Asking

```graphql
{
  element(name: "nav-bar") {
    version
    kind          # COMPONENT or BLOCK
    tokens        # the whole thing
    shards { facet section path tokens sha }
    parts  { name tokens }   # what it is built from
    partOf { name }          # what is built from it
  }
}
```

`elementShard(path:)` resolves one address. `elements(kind:, category:)` lists
them.

### `parts` and `partOf`

A block's parts are components, and the same components are parts of other
blocks - which is why this is a graph and not a list.

`partOf` is the one that answers a question the element's own entry cannot:
**is anything using this?** An element with no `partOf` and no page is an
element that was built and forgotten.

Both are field resolvers, so **the depth is your selection set**. Parts have
parts: `folder-shelf` → `context-menu` → `icon`. Ask for two levels and you
get two.

## Maintaining it

Nothing here is stored twice, and that is what keeps it correct:

| Comes from | Which is |
| --- | --- |
| version, parts, variants, kind | `packages/ui/registry.ts` - authored, inlined at build |
| token costs and content hashes | the `documents` table - synced, can be behind |

So the failure modes are exactly two, and neither is silent:

1. **A shard address that resolves to nothing.** A docs section that does not
   exist is *omitted* rather than reported as zero, because a client that
   fetches an empty body cannot tell "not written yet" from "broken".
2. **Costs that are behind the repository.** The projection is as old as the
   last sync. `syncedAt` says how old.

### After you change an element

```bash
pnpm run doctor                       # variants must be values a prop takes
pnpm sushindustries sync              # costs and hashes catch up
pnpm sushindustries graphql           # only if a column changed
```

The doctor check worth knowing about: **every variant declared in the registry
must be a value the prop actually accepts.** It caught nothing for a while
because `readRegistry()` did not parse `variants` and every item was skipped -
if you add a field to a registry item, check the parser learned about it, or
the check that guards it will pass by having nothing to look at.

## When not to use this

Fetching the whole element is right when you are about to install it. The
shards exist for reading, and reading four thousand tokens to answer a
question that four hundred would have answered is the thing they prevent -
not installing.
