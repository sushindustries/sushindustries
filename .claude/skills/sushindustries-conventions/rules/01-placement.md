# 01 - placement

> Which package owns a file, where it sits inside that package, what it is
> called, and which suffix it takes.

## Rules

| Rule | Layer | Enforced by |
| --- | --- | --- |
| Every visible element of the site is a component in `packages/ui` | House | `nobody` |
| A `packages/ui` component uses only classes defined in `packages/atoms` | House | `doctor` (`checkComponentClassesLiveInAtoms`) |
| Nothing imports from `apps/web/src/routes/` - routes are leaves | House | `doctor` (`checkRoutesAreLeaves`) |
| Only `router.tsx` imports the generated route tree | Official | `doctor` (`checkRoutesAreLeaves`) |
| `.server.ts` never reaches the client bundle | Safety | `build` (import protection) |
| Never mix `.functions.ts` and `.server.ts` behind one barrel | Safety | `nobody` |
| Package content comes from `import.meta.glob`, not from RPC | House | `nobody` |
| kebab-case filenames, PascalCase components, `use-` on hooks | House | `nobody` |
| No `any` | House | `lint` (`noExplicitAny`) |
| Explicit return types, `function` declarations | House | `nobody` |

## Which package owns it

Ask who would want it, not who needs it first.

| Thing | Package |
| --- | --- |
| Anything a visitor sees | `packages/ui` |
| A token, a utility class, a block stylesheet | `packages/atoms` |
| A schema or a database client | `packages/db` |
| Something that renders a site-specific route | `apps/web/src/modules/` |

### The test that decides it

This used to be a list of three exceptions. The site has twenty-five visible
things outside `ui`, every one of them for a reason, so a list of three was a
rule nobody could follow and everybody had to argue with. The principle is
what to read instead:

> **The visible element goes in `ui`. What stays in the app is the wiring:
> anything that names something this site chose.**

A name this site chose is a route, its GitHub remote, a catalogue it globs, or
a word in its Markdown vocabulary. None of those survive being installed
somewhere else, which is the whole test - **if the file were installed into a
different project, would it still mean anything?**

Mechanically: **a file that imports from `apps/web/src/modules/` is wiring.**
That single check separates them today, with no judgement calls left over.

| Stays in the app | Because it names |
| --- | --- |
| `chrome/site-*` | this site's routes, its shelf, its search, its mark |
| `chrome/github-star`, `content/doc-actions` | this repo's GitHub remote (`content/repo`) |
| `content/doc-backlinks` | `references.catalogue`, globbed from this repo |
| `content/doc-feedback` | this site's `/api/feedback` |
| `content/packages/*` | this repo's `packages/` directory |
| `markdown/*-block` | a block name in this site's authoring vocabulary |
| `showcase/stackblitz-embed` | this site's demo registry |
| `assistant/site-assistant`, `theme/site-theme` | this site's own instance of a library part |

The `site-` prefix is not decoration. It is the marker for "this file is one
site's copy of an idea", and a new file that earns it is a file that was never
going to be installable.

**A Markdown block is wiring, not a component.** `card-block.tsx` imports
`Card` from `@sushindustries/ui` and gives it a name Markdown can call. The
visible element is already in the library; what the app adds is the word
`card`. `packages/ui` owns the components and `createBlockDispatcher`; the app
owns the vocabulary. Putting the vocabulary in `ui` would ship one site's
authoring choices to everyone who installed a button.

## Where it sits

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
packages/atoms/src/          one stylesheet, split into chapters
packages/db/src/             schema.ts (safe) + client.server.ts (not)
```

`packages/ui/src/` is flat on purpose. A component is one file, and finding it
is knowing its name.

## Suffixes

| Suffix | Contains | Importable from |
| --- | --- | --- |
| `*.functions.ts` | `createServerFn` wrappers | loaders, components, hooks - statically |
| `*.server.ts` | secrets, DB, filesystem, privileged SDKs | inside handlers only |
| `*.schemas.ts` | Zod schemas, DTOs, constants | anywhere |
| `*.catalogue.ts` | build-time content from `import.meta.glob` | anywhere |
| `*-query-keys.ts` | TanStack Query keys | anywhere |

**Never mix a `.functions.ts` and a `.server.ts` behind one `index.ts`
barrel.** The barrel makes one import pull both, and the safe half is what
gets imported from a component.

`packages/ui/src/index.ts` is a barrel and that is fine: everything in that
package is client-safe React, and nothing with a `.server.ts` may ever be
added to it.

A `.server.ts` may be imported at the top of a **server route** file, because
a server route only exists on the server. That is what `sitemap[.]xml.ts`,
the `llms` routes and the Markdown mirrors all do. The boundary that matters
is the client bundle, and the build is what proves it:

```bash
grep -rl "<a distinctive export from the module>" apps/web/.output/public/_build/assets/
```

Empty passes.

## Content, not RPC

Package pages, posts, docs and built pages come from `import.meta.glob` over
the repo at build time. They are not server functions and must not become
them: the content is public, static and identical for every visitor, so
routing it through RPC would add a network round trip to something the bundler
answers for free.

Reach for `createServerFn` when the answer differs per visitor or per moment,
which today means anything touching `packages/db`.

## Naming

- kebab-case filenames. `scroll-spin.tsx`, never `scrollSpin.tsx`.
- PascalCase components, `use-` prefix on hooks.
- `function` declarations with explicit return types. No `any`.
- Comments explain *why*, per meaningful group, never line by line.
- Comments in English.

## Adding a package

```bash
pnpm new package <name>
pnpm run doctor --fix     # adds the Dockerfile manifest COPY line
pnpm install
```

Create `packages/<name>/package.json` and `packages/<name>/README.md` and you
are done. The site globs `packages/*`, so it appears at `/packages/<name>`
with its README rendered. There is no index to update, which is the point: an
index is a thing that drifts, and the Dockerfile's hand-written one drifted
twice before the doctor started asserting it.

A package with no `name`, or with `private: true`, is skipped.

**`package.json` is partly a build artefact.** `exports`, `main` and `module`
are written by tsdown from the chunks it emitted, so if a build rewrites one,
commit the rewrite - CI diffs them. `files` is the half nothing generates, and
the doctor checks it against the half that is generated.

## Before you finish

- [ ] The file went into the package that would want it, not the one that
      needed it first.
- [ ] Nothing outside `routes/` imports from `routes/`.
- [ ] A new `.server.ts` is unreachable from the client bundle, checked
      against the built output rather than assumed.
- [ ] A new package has its README, and `doctor --fix` wrote its Dockerfile
      line.
