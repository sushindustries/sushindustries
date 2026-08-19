# @sushindustries/cli

[GitHub Packages](https://github.com/sushindustries/sushindustries/pkgs/npm/cli)

The command line for this repository, and the MCP server that hands it to an
agent. Two names for one program: `pnpm sushindustries` inside the workspace,
`adam-jurek` once installed.

## Install

```bash
pnpm add -D @sushindustries/cli
```

Inside this repository it is already wired:

```bash
pnpm sushindustries            # what it can do
```

## What it does

```bash
pnpm sushindustries stack           # what this repo depends on, and why
pnpm sushindustries stack --sync    # rewrite the versions from the workspace
pnpm sushindustries refs            # shard every provider's llms.txt locally
pnpm sushindustries refs --force    # re-fetch shards that already exist
pnpm sushindustries mcp             # serve all seventeen tools on stdio
pnpm sushindustries mcp install     # how to register it, three ways
```

## The two halves

`stack.yaml` and `references/` are the data; `mcp/` serves it. They live in one
package because a published copy has to carry both to be useful offline, and
because one directory owning the data and the program that reads it is the same
rule the rest of this repo follows.

| Group | Tools | Reads |
| --- | --- | --- |
| docs | `list-docs`, `read-doc`, `search-docs` | Markdown in this repository |
| stack | `list-stack`, `list-providers`, `list-sections`, `find-reference` | 9,152 sharded index entries |
| authoring | `list-slugs`, `list-templates`, `read-template`, `create-*`, `plan-slug-change` | the live sitemap, and `templates/` |

One server, not three. The organisation is in the tool names, which is where it
reads better and where it costs nothing to keep.

## What the shards contain

Links, titles, section names, and each provider's own one-line descriptions,
taken from the `llms.txt` they publish for exactly this purpose. Never page
content.

That boundary is the point rather than an oversight. What is kept is the map -
enough to know which page answers a question - and the prose stays on the
server that wrote it. Storing the pages themselves would make this a copy of
thirty-five projects' documentation, which is a different thing with a
different set of obligations.

## Where the answers come from

Nothing here maintains a list.

The component sections are the tabs the site renders. The slug list is read
back from the sitemap the site generates, so it cannot claim a URL that is not
served. The stack shards are each provider's own index. Every one of these
reads a source something else already produces, because a second list is a
thing that goes wrong quietly and the first symptom is an answer that sounds
right.

## Keeping it honest

```bash
pnpm sushindustries refs --force
pnpm sushindustries stack --sync
```

Run both when a dependency is upgraded. A stale index is worse than a missing
one, because it looks current.
