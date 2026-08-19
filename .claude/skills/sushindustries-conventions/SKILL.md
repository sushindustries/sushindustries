---
name: sushindustries-conventions
description: Layout, naming and boundary rules for the sushindustries monorepo - where a new file goes, what it is called, and which of apps/web, packages/ui, packages/atoms or packages/db owns it. Use before adding or moving any file in this repo, and before writing site copy.
---

# sushindustries conventions

This repo's convention authority. The global `tanstack-start-architecture`
skill still applies for its **Official** and **Safety** layers - loaders are
isomorphic, `.server.ts` never reaches the client, mutations validate their
input. Its **Project convention** layer describes a different codebase; where
the two disagree about layout, this file wins.

## The rule that decides most questions

**Every visible element of the site is a component in `packages/ui`.**

The site is the library's first consumer, not a special case of it. Before
adding a component to `apps/web`, ask whether someone installing
`@sushindustries/ui` would want it. Usually they would, and the objection
"but it needs to know about X" is answered with a prop, not with a copy in the
app.

Only these stay in `apps/web/src/modules/`:

| Thing | Why it is not in `ui` |
| --- | --- |
| `chrome/site-nav`, `chrome/site-footer` | Encode this site's own routes |
| `chrome/placeholder-mark` | The logo. `ScrollSpin` is the reusable half |
| `content/packages/*` | Globs this repo's `packages/` directory |

## Where a file goes

```text
apps/web/src/
├── routes/                  URL structure only. Thin.
│   ├── __root.tsx
│   ├── index.tsx
│   ├── health.ts            server route (HTTP semantics only)
│   └── packages/
│       ├── index.tsx
│       └── $slug.tsx        dynamic segments stay FLAT files
├── modules/<domain>/<feature>/
└── styles/

packages/ui/src/             one component per file, flat
packages/atoms/src/          one stylesheet
packages/db/src/             schema.ts (safe) + client.server.ts (not)
```

### Route rules

- Export the route instance as `Route`. Always.
- Static segments may become directories (`packages/index.tsx`).
- **Dynamic segments must stay flat files.** `packages/$slug.tsx`, never
  `packages/$slug/index.tsx` - converting one breaks URL matching, and the
  trailing-slash form redirects to the dead route.
- Co-locate with `-components/`, `-hooks/`, `-sections/`. The `-` prefix is
  Router's ignore prefix, so these never become routes.
- Publishing-only pages get no empty `-hooks/` or `-components/` folders.

### File suffixes

| Suffix | Contains | Importable from |
| --- | --- | --- |
| `*.functions.ts` | `createServerFn` wrappers | loaders, components, hooks - statically |
| `*.server.ts` | secrets, DB, filesystem, privileged SDKs | inside handlers only |
| `*.schemas.ts` | Zod schemas, DTOs, constants | anywhere |
| `*.catalogue.ts` | build-time content from `import.meta.glob` | anywhere |
| `*-query-keys.ts` | TanStack Query keys | anywhere |

Never mix a `.functions.ts` and a `.server.ts` behind one `index.ts` barrel.
`packages/ui/src/index.ts` is a barrel and that is fine - everything in that
package is client-safe React, and nothing with a `.server.ts` may ever be added
to it.

### Naming

- kebab-case filenames. `scroll-spin.tsx`, never `scrollSpin.tsx`.
- PascalCase components, `use-` prefix on hooks.
- `function` declarations with explicit return types. No `any`.
- Comments explain *why*, per meaningful group - never line by line.
- Comments in English.

## Content, not RPC

Package pages are built from `import.meta.glob` over `packages/*` at build
time. They are not server functions and must not become them: the content is
public, static and identical for every visitor, so routing it through RPC would
add a network round trip to something the bundler answers for free.

Reach for `createServerFn` when the answer differs per visitor or per moment -
which today means anything touching `packages/db`.

## Adding a package

Create `packages/<name>/package.json` and `packages/<name>/README.md`. Done.
The site globs the directory, so it appears at `/packages/<name>` with its
README rendered and highlighted. There is no index to update, which is the
point - an index is a thing that drifts.

A package with no `name`, or with `private: true`, is skipped.

## Styling

Atomic classes from `@sushindustries/atoms`. One class, one job. Compose in
markup; do not write a component-specific stylesheet.

### Where a style goes in atoms

`atoms.css` is an **entry, not a stylesheet**. It holds the layer statement and
then nothing but imports:

```css
@layer tokens, base, blocks, utilities;   /* the cascade, decided here */

@import "./devices.css" layer(blocks);
@import "./tokens.css";
@import "./base.css";
@import "./utilities.css";
@import "./blocks/nav.css";               /* one file per chapter */
```

Each chapter file opens with its own `@layer` wrapper. Cross-layer precedence
comes from the statement at the top, so **file order cannot change which layer
wins**. That is what makes splitting safe, and it is why a chapter must never
be pasted back into the entry.

Three rules follow:

- **A new chapter is a new file plus a line in the entry.** Nothing globs the
  directory, on purpose: the import list *is* the cascade order, so it has to
  be written where a human can read it top to bottom.
- **Order inside a layer still matters.** Rules in the same layer resolve by
  source order on a specificity tie, and `pnpm run doctor` resolves a declaration
  to the first rule providing it. So `utilities.css` is imported before
  `blocks/`, and a chapter goes where its rules already sat.
- **Never reopen a chapter later in the list.** Two `@import`s of the same file
  split its rules around whatever is between them.

Vite flattens every `@import` at build time, so the browser still gets one
file. This was measured, not assumed: splitting 7,990 lines into 44 chapters
emitted a byte-identical asset with the same content hash.

If a value is not in the scale, add it to the scale or use the scale. There is
no arbitrary-value syntax and that is deliberate - a short scale is what makes
an interface look measured rather than assembled.

The one exception is `.prose`, where elements are styled by tag. Markdown tags
come from the author, so there is no markup to attach classes to.

**Every class a `packages/ui` component uses is defined in `packages/atoms`.**
Not in `apps/web/src/styles/`. A component whose CSS lives in the site is a
component that arrives naked in somebody else's project, and it looked finished
only because it was being read on the one page that had the stylesheet.
`pnpm run doctor` fails on this, and it found `Showcase` doing exactly that.

### Variants and extension

A variant is a **prop that writes a data attribute**. Never a second class.

```tsx
<Card density="compact" />          // component writes data-density="compact"
```

```css
.card[data-density="compact"] {
	padding: var(--s-3);
}
```

Not `.card--compact`. A modifier class needs a consumer to know both names and
can be applied without its base; an attribute cannot be applied halfway,
travels with the component when it is installed, and shows up in the props
rather than in a stylesheet somebody has to go and find. `pnpm run doctor` rejects
`--` in a class name in `packages/ui`.

State uses the same mechanism: `data-active`, `data-open`, `data-view`. The
one legacy exception in the codebase is `.archive-chip.is-active`.

Three more rules that follow from it:

- **Extend a block, do not fork it.** A new look is a new attribute value on
  the existing selector, in the same section of `atoms.css`. A second block
  that is 90% the first one is two things to keep in step.
- **Colours are tokens, always.** A literal hex outside `:root` is the point at
  which changing `--accent` stops changing the site. Add the token, then
  reference it. `pnpm run doctor` fails on this too.
- **A utility earns its place by repeating.** Used once, inline it into the
  named block. Used three times, it is an atom. `px-3` sat in the markup for
  weeks without existing in the stylesheet, doing nothing, because nothing
  checked.

## Documentation

**A doc file lives at `packages/<pkg>/docs/<slug>/<section>.md`, exactly three
levels, and `<section>` is one of `index`, `get-started`, `guides`, `api`,
`examples`.** Anything else renders on no page at all.

That is a location rule, and both halves of it have been broken. A file named
for something outside the five was silently filtered out by the catalogue. A
file one level shallower - `packages/assistant/docs/index.md`, 208 lines -
matched neither the glob nor the check that was supposed to catch it, and was
invisible for as long as it existed. `pnpm run doctor` now asserts both.

**The API tab is generated, so the prop description is a JSDoc comment.**
Editing the table in `api.md` is the wrong move: the fenced region is rewritten
from the interface, and the doctor fails when the two disagree. Writing the
sentence on the interface instead puts it on the docs page and in every
consumer's editor at once.

The rest of the contract - which tab a section belongs in, the word budgets,
and the rule that a heading must give the reader something to copy - is in
`.claude/skills/document-an-element/SKILL.md`. `pnpm run docs` reports where a page
falls short of it.

## Voice

One person builds this. Write "I", not "we". No "our team", no royal plural,
in site copy, READMEs and comments alike.

Short sentences. Plain words. `h1` then `h2` then `h3`, in order, because the
outline is the page's structure and not its decoration.

## Motion

Lenis drives page scroll. Scroll-linked animation writes transforms in a
`requestAnimationFrame` callback, never through React state - at 60fps a
state-driven version re-renders the subtree every frame.

Every animated component checks `prefers-reduced-motion` and stops. A `Reveal`
that respects the preference shows its children immediately; leaving them
hidden turns the preference into a blank page.

First render must be identical on server and client. Decide visibility from an
effect, never from scroll position during render.
