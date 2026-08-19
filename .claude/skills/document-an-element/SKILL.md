---
name: document-an-element
description: Write or fix the documentation for a component, block or hook in this repo - which of the five tabs a thing belongs in, what each tab must contain, and why the API tab is generated from the source rather than written. Use when adding docs, when `pnpm run docs` reports a finding, or when a page has become too long.
---

# Documenting an element

Every element has up to five tabs, and **each tab is a file**:

```text
packages/<pkg>/docs/<slug>/
├── index.md         Home         what it is, shown running
├── get-started.md   Get Started  render it once
├── guides.md        Guides       what is true after it works
├── api.md           API          generated - see below
└── examples.md      Examples     it doing a job
```

The tab bar is built from the files that exist. There is no route to edit and
no list to update.

## The one thing to know first

**`api.md` is generated from the source.** The `Does` column is the JSDoc on the
prop, so to change a description you edit the interface, not the Markdown:

```ts
// packages/ui/src/badge.tsx
export interface BadgeProps {
	/** Colour family, resolved by the stylesheet. Absent is the quiet default. */
	tone?: string;
}
```

```shell
pnpm run doctor --fix    # the table catches up
```

That is the better trade in both directions: one sentence now serves the docs
page *and* every consumer's editor hover, and the table cannot drift, because
`pnpm run doctor` fails when it does.

The generated half is fenced. Everything outside the fence is yours and is
never rewritten:

```md
<!-- generated:api -->
## Props
| Prop | Type | Default | Does |
<!-- /generated:api -->

## Notes          <- yours
```

A file with no fence is reported and left alone. That rule exists because the
first version inferred the boundary from headings and deleted eighteen lines of
somebody's writing.

## The three commands

```shell
pnpm run docs                  every element, every tab, what is missing
pnpm run docs --todo           only the rows with a gap
pnpm run docs --slug button    one element, every finding, and the command to fix it
pnpm new docs button api   add a tab. `api` arrives filled in from the source
```

## Which tab does this belong in

Apply per `##` section, top down. **Move whole sections. Never split one across
tabs** - that is where content gets rewritten instead of relocated.

| A section about | Goes to |
| --- | --- |
| installing, first render, "what you should see", "if nothing happens" | `get-started.md` |
| props, types, a signature | `api.md` (generated - put the sentence in the JSDoc) |
| composition, variants, reduced motion, traps, when not to use it | `guides.md` |
| the component doing a job in a real page | `examples.md` |
| what it is, the live block, why it is built this way, what it does not do | `index.md` |

## The contract, which `pnpm run doctor` enforces

| Section | Must have |
| --- | --- |
| any | `title:` and `summary:`, both non-empty; body starts at `##`, never `#` |
| any | every `##` carries a fence, a table, a live block or a callout - **or** is under 80 words |
| `index` | a live block when a demo exists; a lead paragraph of 60 words or fewer; 350 words in total |
| `get-started` | at least one `tsx` fence |
| `api` | the fenced section matches the source exactly |
| `examples` | a live block **and** a `tsx` fence |
| `guides` | nothing structural - this is the tab for prose that earned its place |

Two of those need saying plainly.

**350 words on Home is not a length limit.** A Home tab over budget is carrying
another tab's content. The fix is `pnpm new docs <slug> guides` and moving
sections into it, never deletion.

**"Every `##` earns its place"** is the no-life-story rule. It does not ban
prose. It bans a heading that introduces a page of talk and hands the reader
nothing to copy. Under 80 words a paragraph stands on its own; over 80 it owes
you an example.

Exempt, because the templates create them and they are prose by design: `Why it
is built this way`, `What it does not do`, `When not to use it`, `What this
example is not`, `What you should see`, `If nothing happens`, `Notes`.

## Install commands are never written by hand

Anything in `packages/ui/registry.ts` gets its TanStack, shadcn and pnpm
commands appended to Home automatically, with its version, files and
dependencies. Writing your own is a second copy that goes stale the day a URL
changes.

An element with no registry entry - `product-viewer`, `motion` - gets nothing
appended, because there is no entry to generate from. Those write their own.

## Voice

One person builds this. Write **"I"**, never "we" or "our". Short sentences,
plain words, no transitional filler. No em dashes anywhere: `pnpm run doctor` fails
on one, and the house form is a spaced hyphen.

Say what the thing avoids, not what the code does - the source already says
what the code does.

## Blocks available in any of these files

| Block | Renders |
| --- | --- |
| `<!-- ::start:showcase demo="x" height="420" -->` | the live component at three widths, with source |
| `<!-- ::start:viewer model="/models/logo.glb" -->` | the 3D viewer |
| `<!-- ::start:tabs -->` with `###` headings | CSS-only tabs |
| `> [!NOTE]` / `[!TIP]` / `[!CAUTION]` | callouts |

## Before you push

```shell
pnpm run docs --slug <name>    # no findings for the element you touched
pnpm check                 # doctor, biome, types, build, pages
```
