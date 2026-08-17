---
name: simplify
description: Find and remove the excess in this repo - documentation that ran long, components that render nothing, code nothing imports, and rules nothing checks. Use before a release, when a page "looks broken but is 200", when a doc has become a manual, or whenever something works locally and not in production.
---

# Simplify

Most of what is wrong here is not broken code. It is **work that grew past the
thing it was for**: a Home tab that became a manual, a policy that blocked its
own page, a label that outgrew its tile, a check nobody wrote.

Every rule below is a bug this repo actually shipped. None of them failed
loudly. That is the point - the whole class is invisible in a diff and obvious
in a directory, which is why `pnpm doctor` exists and why the first move is
always to measure rather than to read.

## Start by measuring

Never open files looking for excess. Count first, then open the top of the list.

```shell
pnpm doctor          # what is missing or wrong, structurally
pnpm doctor --map    # how the repo is actually constructed, read from itself
pnpm check           # doctor, biome, types, build, pages - what the hook runs
```

Then the three measurements that catch what the doctor does not yet:

```shell
# Documentation that became a manual. Home is a shop window, not a book.
for f in packages/*/docs/*/index.md; do
  n=$(wc -w < "$f"); [ "$n" -gt 350 ] && echo "$n $f"
done | sort -rn

# Exports nothing imports.
for s in $(grep -oE 'from "\./[a-z-]+"' packages/ui/src/index.ts | sort -u); do :; done

# Pages that answer 200 and render nothing.
curl -s localhost:3000/preview/<slug> | wc -c
```

A preview page is about 6.5 kB of shell. Much more than that means content;
about that exactly means the route matched and the component rendered nothing.

## The five kinds of excess

### 1. A document that outgrew its tab

The component pages have five tabs - Home, Get Started, Guides, API, Examples -
and for a long time nobody used four of them, so `index.md` carried everything.
The median is 140 words; the worst was 2,177.

**A Home tab over ~350 words is not too long. It is carrying another tab.** The
fix is relocation, never deletion, and each `##` has exactly one destination:

| A section about | Goes to |
| --- | --- |
| installing, first render, "if nothing happens" | `get-started.md` |
| props, types, a signature | `api.md` |
| composition, variants, reduced motion, traps, when not to use it | `guides.md` |
| the component doing a job in a real page | `examples.md` |
| what it is, the demo, why it is built this way, what it does not do | stays |

Move whole sections. Splitting one across tabs is where judgement creeps back
in and where content gets rewritten instead of moved.

### 2. A heading that earns nothing

A `##` should give the reader something to take away: a fence, a table, a live
block, or a callout. A heading that introduces a page of prose and hands over
nothing is the "life story" failure.

The test: **if a section has no fence, no table, no block and no callout, it
must be under 80 words.** Prose is not banned - unearned headings are.

Exempt, because the templates create them and they are prose by design: `Why it
is built this way`, `What it does not do`, `When not to use it`, `What this
example is not`, `What you should see`, `If nothing happens`, `Notes`.

### 3. Something that renders nothing and says 200

The expensive class, because nothing reports it.

- **A CSP that blocks its own page.** `script-src 'self' 'unsafe-inline'` threw
  `CompileError: WebAssembly.instantiate()` inside the GLB decoder, so every 3D
  viewer was an empty canvas in production - and worked locally, because dev
  adds `'unsafe-eval'`, which permits Wasm too.
- **A queue that never starts on the server.** `React.lazy` invokes its loader
  while rendering, and rendering happens on the server first, so a paced import
  waiting on `requestIdleCallback` waits forever. 25 seconds, then nothing.
- **A file at the wrong depth.** The docs glob wants
  `packages/<pkg>/docs/<slug>/<section>.md`. 208 lines sat one level shallower
  and rendered on no page at all.

The rule this produces: **check it in a browser, in a production build, before
believing it works.** Console errors, not curl.

```shell
cd apps/web && pnpm build && node .output/server/index.mjs
```

### 4. A value that outgrew its container

A desktop icon label is a tile six to nine characters wide.
`@sushindustries/react-product-viewer` is thirty-six characters with no space
in it, so it could not wrap: it laid out 148px wide inside a 108px tile and
overlapped its neighbours.

Two fixes, and both are needed:

- **The container must survive anything.** `min-width: 0` and
  `overflow-wrap: anywhere` so a label can never leave its tile.
- **The value should not need saving.** The scope was identical on all seven
  entries, so it spent sixty per cent of every tile repeating a word that
  distinguishes nothing. The short name says the same thing.

Never truncate an identifier to make it fit. `@sushindustries/re` is a package
name somebody will try to install. Wrap it, or shorten it deliberately at the
source.

### 5. A rule nothing checks

The repo's own closing line: *if something breaks twice, it belongs in
`scripts/doctor.mjs`.*

A check is cheaper than a rule people remember. Write it in the house idiom -
a `check*` function, a JSDoc first line for `doctor:map`, `report(check, path,
message, hint)` - and **state the limit once**. When a check and a schema both
need a number, one of them parses it out of the other:

```js
const limit = Number(/MAX_LABEL = (\d+)/.exec(read(schema))?.[1]);
```

Two copies of a limit is a limit that will disagree with itself.

## What not to simplify

- **Unwired is not dead.** `product-viewer` and `react-product-viewer` export
  APIs with no registry entry. That is missing documentation, not dead code,
  and deleting it loses work. Register it instead.
- **A generated rule is not an authored one.** `{posts}` and `{components}`
  expand into entries labelled with post titles. Holding generated data to an
  authoring limit made a validator throw on correct content and rendered the
  shelf as an error. Enforce authoring rules on what a person types.
- **Comments that name an incident.** A comment saying why something is the way
  it is, and what broke when it was not, is the most expensive thing in the file
  to reconstruct. Length is not the measure.
- **A deliberate absence, already measured.** No `Cross-Origin-Embedder-Policy`
  is a decision with the numbers written next to it. Re-measure before
  reversing; do not take DevTools' advice on trust.

## Before you finish

```shell
pnpm check
```

Then the thing measurement cannot do: open the page, in the built server, and
look at it. Today's two worst bugs were both invisible to every test and
obvious in one screenshot.
