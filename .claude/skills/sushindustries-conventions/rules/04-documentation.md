# 04 - documentation

> Five tabs, all of them files. The API tab is generated from the source, so
> the prop description is a JSDoc comment.

The full contract - which tab a section belongs in, the word budgets, and the
rule that a heading must give the reader something to take away - is in
`.claude/skills/document-an-element/SKILL.md`. This file is the placement and
enforcement half.

## Rules

| Rule | Layer | Enforced by |
| --- | --- | --- |
| A doc file sits at `packages/<pkg>/docs/<slug>/<section>.md`, exactly three levels | House | `doctor` (`checkDocsAreAddressable`) |
| `<section>` is one of `index`, `get-started`, `guides`, `api`, `examples` | House | `doctor` (`checkDocSectionsAreReal`) |
| `api.md` matches the interface it documents | House | `doctor` (`checkApiDocsMatchSource`, repairable) |
| Every documented element has a non-empty `summary:` | House | `doctor` (`checkDocsHaveSummaries`, repairable) |
| Every registry item has a docs page and a demo | House | `doctor` (`checkRegistryItemsHaveDocs`, `checkRegistryItemsHaveDemos`) |
| A backticked registry or package name is a reference | House | `doctor` (`checkMentionsAreReferences`) |
| Every content file carries the frontmatter its catalogue reads | House | `doctor` (`checkContentFrontmatter`) |
| Headings descend in order, one `h1` per page | House | `tests` (`semantics.test.ts`) |

## Location

**A doc file lives at `packages/<pkg>/docs/<slug>/<section>.md`, exactly three
levels.** Anything else renders on no page at all.

Both halves of that have been broken. A file named for something outside the
five sections was silently filtered out by the catalogue. A file one level
shallower - `packages/assistant/docs/index.md`, 208 lines - matched neither
the glob nor the check that was supposed to catch it, and was invisible for as
long as it existed. `pnpm run doctor` now asserts both.

```bash
pnpm new docs <slug> <section>
```

## The API tab is generated

`packages/<pkg>/docs/<slug>/api.md` carries a `<!-- generated:api -->` fence,
and what is inside it comes from the exported interface: names, types,
defaults read out of the destructuring parameter, and the JSDoc as the
description.

So **the `Does` column is a source comment.** Editing the table is the wrong
move - the fence is rewritten from the interface and the doctor fails when the
two disagree. Writing the sentence on the interface instead puts it on the
docs page and in every consumer's editor at once.

`pnpm run doctor --fix` regenerates. A file with no fence is reported and
never rewritten, because inferring the boundary from headings once deleted
eighteen lines of somebody's writing.

## The reporting command

```bash
pnpm run docs                 # one row per element, one column per tab
pnpm run docs --todo          # only the rows with a gap
pnpm run docs --slug <name>   # expand one element, print the fixing command
pnpm run docs --json          # for something else to read
```

It always exits 0. The doctor is the gate, and a report that can fail a build
is a second gate that will disagree with the first.

## Before you finish

- [ ] The file is at exactly `packages/<pkg>/docs/<slug>/<section>.md`.
- [ ] A prop description was written on the interface, not into `api.md`.
- [ ] `pnpm run doctor` passes, and any `--fix` regeneration is in the commit.
- [ ] `pnpm run docs --slug <name>` shows no gap worth leaving.
