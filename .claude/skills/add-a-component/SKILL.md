---
name: add-a-component
description: The pipeline for adding a component, a demo, its docs and its registry entry to the sushindustries monorepo, so it appears in the component museum and is installable via TanStack CLI and shadcn. Use whenever adding or changing anything under packages/ui, packages/*/docs, or the showcase/registry modules.
---

# Adding a component

Six files, one name. Everything keys off the same slug, so getting the name
right once is most of the work.

Use **kebab-case** for the slug. It is the filename, the URL segment, the
registry id, the demo id and the preview route, all at once.

## Start with the scaffold

```shell
pnpm new component my-thing
```

That writes the source, the docs page, the barrel export and the registry entry
from `templates/`, then prints what it deliberately left blank. It does not
invent a description, a category or a demo: a scaffold that fills those with
placeholder text produces a file that looks finished, and `pnpm run doctor` can no
longer tell the difference.

Then, at any point and as often as you like:

```shell
pnpm run doctor         # what is missing
pnpm run doctor --fix   # repair what can be repaired without inventing prose
```

The doctor is the list below, checked. Read it rather than remembering this
file.

## The pipeline

```text
1. packages/ui/src/<slug>.tsx            the component
2. packages/ui/src/index.ts              export it
3. packages/ui/package.json              exports subpath
4. packages/ui/registry.ts               registry entry  -> REQUIRED
5. apps/web/src/modules/showcase/demos.tsx   live demo   -> optional
6. packages/ui/docs/<slug>/*.md          docs           -> optional
```

**Step 4 is the only one that gates anything.** A registry entry alone produces
a full page at `/components/<slug>`: description, install tabs for both
installers, a dependency table, and a live showcase if a demo exists. It also
puts the card in the archive under the right filter.

Steps 5 and 6 improve that page. They do not create it. This matters because
the previous arrangement made docs mandatory in practice - seven of ten cards
linked nowhere because nobody had written Markdown for them yet.

| You wrote | You get |
| --- | --- |
| registry entry only | generated page: description, install, dependency table |
| \+ a demo | the above, with a live preview at three widths, and an archive thumbnail |
| \+ `docs/<slug>/index.md` | your Markdown replaces the generated Home section |
| \+ `docs/<slug>/api.md` etc. | extra tabs, in the fixed order |

### 1. The component

```tsx
// packages/ui/src/my-thing.tsx
import type { ReactNode } from "react";

export interface MyThingProps {
	title: string;
}

export function MyThing({ title }: MyThingProps): ReactNode {
	return <div className="card">{title}</div>;
}
```

Rules that are not negotiable here:

- Emit atomic class names from `@sushindustries/atoms`. Do not ship a
  stylesheet per component.
- If a value is not in the scale, add it to the scale - there is no arbitrary
  value syntax and that is the point.
- Explicit return type, no `any`, `function` declarations.
- Anything browser-only goes in an effect, so the first server render and the
  first client render are identical.
- Check `prefers-reduced-motion` in anything that animates, and degrade to the
  visible, still state - never to the hidden one.

### 2 and 3. Export it

```ts
// packages/ui/src/index.ts
export { MyThing, type MyThingProps } from "./my-thing";
```

```jsonc
// packages/ui/package.json
"exports": { "./my-thing": "./src/my-thing.tsx" }
```

The barrel is only safe because everything in this package is client-safe
React. Never add a `.server.ts` to `packages/ui`.

### 4. Registry entry

```ts
// packages/ui/registry.ts
{
	name: "my-thing",
	title: "My Thing",
	description: "One sentence, present tense.",
	files: ["my-thing.tsx"],
	dependencies: { lenis: "1.3.26" },   // pinned, not "latest"
	registryDependencies: ["reveal"],     // other items in this registry
}
```

State versions. A copied component is verified against one version of its
dependency, and `latest` is how an install works for you and breaks for
everyone else.

This one entry produces both installers:

```shell
tanstack add https://sushindustries.com/r/tanstack/my-thing.json
pnpm dlx shadcn@latest add https://sushindustries.com/r/shadcn/my-thing.json
```

Nothing else is generated or committed - the routes render the formats on
request from `packages/ui/src`, which stays the only copy.

### 5. The demo

```tsx
// apps/web/src/modules/showcase/demos.tsx
"my-thing": {
	element: <MyThing title="Hello" />,
	source: `<MyThing title="Hello" />`,
	language: "tsx",
},
```

`source` is written by hand beside the element rather than derived from it.
Deriving source from JSX is a compiler; writing it is two lines.

Demos render only inside `/preview/<slug>`, in an iframe, so a heavy demo costs
the documentation page nothing.

### 6. The docs

```shell
pnpm run docs --slug my-thing     # what is missing, and the command for each
pnpm new docs my-thing api    # the prop table, filled in from your source
pnpm new docs my-thing guides
```

```text
packages/ui/docs/my-thing/
├── index.md         Home        (replaces the generated section)
├── get-started.md   Get Started
├── guides.md        Guides
├── api.md           API         generated - edit the JSDoc, not the table
└── examples.md      Examples
```

**Write the JSDoc on your props.** It becomes the `Does` column of `api.md` and
the editor hover for everyone who installs this, and `pnpm run doctor` fails when
the table and the interface disagree. That is the one place where editing the
Markdown is the wrong move.

`.claude/skills/document-an-element/SKILL.md` has the contract each tab has to
meet, and which tab a given section belongs in.

The tab bar is built from the files that exist. One file is one tab; there is
no route to edit and no list to update. Only `index.md` needs frontmatter:

```md
---
title: My Thing
summary: One line, shown under the heading and in search results.
---
```

Docs live in the package, not on the site, because anyone who installs the
package gets them. Documentation shipped beside the code cannot drift from the
version somebody actually installed.

## Blocks available in any Markdown file

| Block | Renders |
| --- | --- |
| `<!-- ::start:showcase demo="my-thing" height="460" -->` | preview at three widths, source, install commands |
| `<!-- ::start:viewer model="/models/logo.glb" -->` | the 3D product viewer |
| `<!-- ::start:tabs -->` with `##` headings | CSS-only tabs |
| `> [!NOTE]` / `[!TIP]` / `[!CAUTION]` | callouts |

The showcase block takes one attribute because the demo id is also the preview
route, the registry id and the source key. Add a block in
`apps/web/src/modules/markdown/blocks.ts` and it works in posts, component docs
and package READMEs at once.

## Adding a whole package instead

```shell
mkdir -p packages/my-package
```

`package.json` plus `README.md` is the entire requirement - it appears at
`/packages/my-package` on the next build. `"private": true` keeps it off the
site. If it touches secrets or a database, the connection goes in a
`.server.ts` file, which Start's default import protection refuses to include
in a client bundle.

## Before you push

```shell
pnpm check     # doctor, biome, typecheck, build - the same order the hook runs
```

This is what `.husky/pre-push` runs, so a push either passes it or you chose
`--no-verify`. Cheapest first: the doctor reads the directory, biome reads the
files, the build is last.

The build is the one that matters: import protection fails a build rather than
warning, so a broken client/server boundary shows up here and nowhere else.
`typecheck` depends on `build` in `turbo.json`, because the route tree is
generated and gitignored - without that order it passes on a stale generated
file and fails in a clean checkout.

Then check the pages actually render, because a route tree that has gone stale
in a running dev server will 404 a route that is perfectly correct:

```shell
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/components/my-thing
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/preview/my-thing
curl -s http://localhost:3000/r/tanstack/my-thing.json | head -20
```

**Restart the dev server before concluding a route is broken.** Deleting or
adding route files leaves the running server serving a stale tree, and a
correct route will 404 for that reason alone.
