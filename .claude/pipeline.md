# The pipeline

From "I want to add something" to "it is live", and what stops each step from
costing money it did not need to.

## The commands

```shell
pnpm new <post|page|desk|docs|component|package|glyph> <slug> [section]
pnpm run doctor                                      # what is missing
pnpm run doctor --fix                                # repair what can be repaired
pnpm run doctor:map                                  # how the repo is constructed
pnpm run docs                                        # what every element documents
pnpm check                                       # doctor, lint, types, build
```

`pnpm run docs` is a checkbox matrix: one row per element, one column per
documentation tab, plus whether it has a demo and whether it meets the
contract. `--todo` narrows it to the rows with a gap, `--slug <name>` expands
one element and prints the command that fixes each finding, `--json` is for
something else to read. It always exits 0 - the doctor is the gate, and a
report that can fail a build is a second gate that will disagree with the
first.

`doctor:map` prints the construction from the repo itself - workspaces from
the directories, the cascade from atoms.css, module and content counts, the
registry by category, and every check with its own first sentence. Read it
before changing structure: it is current by construction, because it reads
the same sources the checks read.

`pnpm check` is what `.husky/pre-push` runs. The hook installs itself: the
root `prepare` script runs `husky`, so a clone gets it from `pnpm install`.
It can be bypassed with `git push --no-verify`, because a hook you cannot
bypass is a hook people delete.

## Where the checking happens, and why there

Each layer catches what the layer before it cannot see, and costs more than it.

| Layer | Runs | Catches | Costs |
| --- | --- | --- | --- |
| `pnpm run doctor` | seconds, no build | missing docs, missing Dockerfile lines, a class defined nowhere | nothing |
| `pnpm test` | pre-push, after the build | what the *served page* gets wrong: a skipped heading, a second h1, a dead link, a page nothing lists, a phone-width overflow | seconds |
| `pnpm check` | pre-push | types, import protection, a build that does not build | a minute |
| CI `check` | on push and PR | the same, in a clean checkout, plus publint, attw and a manifest that disagrees with its build | GitHub minutes |
| CI `image` | after `check` passes | a Docker build that fails, an image that will not boot | the expensive one |
| Railway | after CI, on watched paths | nothing new. It deploys. | the build you already paid for once |

The order is the point. Three deploys failed in a row on things a developer
machine cannot see, and each of those failures was found by a layer that had
not existed yet:

- a workspace whose `dist` was never built, because the Dockerfile built only
  the app
- a `COPY` of a `node_modules` that does not exist, because `packages/atoms`
  has no dependencies so pnpm never creates one
- a cache mount whose id Railway's builder rejects

And then one red CI run on a fourth: `routeTree.gen.ts` is generated and
gitignored, so `tsc` passed here and failed in a clean checkout. That one is
fixed by declaring `typecheck` after `build` in `turbo.json`, and the doctor
now refuses any repeat of the shape.

## The pages, checked as pages

`pnpm test` (`apps/web/tests/`) boots the **built** server - the same
`.output/server/index.mjs` Railway runs - and reads every URL in the sitemap.
Not the dev server: the dev pipeline injects its own client entry into the
stream, so a check that passes against markup production never serves is a
check against nothing.

Two suites, in the order they cost:

- **`semantics.test.ts`** fetches each page and parses it: one `h1`, no
  skipped heading levels, the three landmarks, a title and a description,
  alt text, no unresolved `::start:` marker, every internal link resolving,
  and every linked page present in the sitemap. Scripts are stripped before
  the assertions, because the serialized loader data quotes each page's raw
  Markdown and would otherwise answer for it.
- **`layout.test.ts`** opens the same pages in headless Chromium at 360px and
  1280px with **JavaScript off** - the site is server-rendered, so hydration
  must not be the thing that fixes an overflow - and measures: nothing wider
  than the viewport, the Markdown grid side by side on desktop and stacked on
  a phone, a type scale that keeps its order.

The sitemap is the roster on purpose. It is built from the same site index as
`llms.txt`, so a page the tests never saw is a page no crawler was told about
either, and the reverse check fails any page the site links to but does not
list. That pairing is what found `/p/*` missing from both.

A machine without Chromium skips the geometry half with the command to fix it;
CI installs it and never skips.

**Editing `atoms.css` invalidates the site build**, and it has to. Atoms has
no build step, so a `^build` edge captures nothing of it: editing the
stylesheet once left every cached build valid and the built server went on
serving the previous one. The first run of these tests found it, by fixing a
phone overflow four times and watching the same 285px come back.

The thing that now guarantees it is the `transit` task in `turbo.json`, not a
`globalDependency`. `transit` depends on `^transit` and `build` depends on
`transit`, so a package's *sources* enter its dependents' hash without anyone
waiting on a build output that does not exist. A `globalDependency` would
have worked too and cost more: it enters the global hash, so every task in
every package would rebuild on a CSS edit.

Check it rather than trust it. Append a comment to `atoms.css` and compare:

```shell
pnpm exec turbo run build --dry=json --filter=@sushindustries/web
```

The `@sushindustries/web#build` hash must change.

## Not paying twice

- **`image` needs `check`.** They used to run in parallel, so a typo in a type
  annotation still paid for a full multi-stage image build. The expensive job
  only runs on a commit that has earned it.
- **Concurrency cancels superseded runs.** Nothing is learned from finishing a
  run for a commit that is already behind.
- **Turbo's cache is restored in CI**, keyed on the lockfile. A commit that
  changes only Markdown restores the previous build instead of repeating it.
- **Docker layers cache to GHA**, and the deps stage copies manifests only, so
  it stays warm until a dependency actually changes.
- **Railway has `watchPatterns`.** Editing `.claude/`, `.github/`,
  `templates/`, `scripts/` or a root Markdown file does not trigger a deploy,
  because none of it reaches the running server.

The one thing deliberately *not* optimised is the pre-push build. It is the
slowest local step and it is not optional: import protection and workspace
resolution only fail at build time, so a push without it is a guess.

## Adding each kind of thing

### A post

```shell
pnpm new post my-post
```

Writes `apps/web/content/posts/my-post.md` with the frontmatter the catalogue
reads. Fill in `summary:`, set `draft: false`, push. There is no index to
update: `import.meta.glob` inlines every file at build time, so writing a post
is adding a Markdown file and nothing else.

### A component

`pnpm new component my-thing`, then see
`.claude/skills/add-a-component/SKILL.md`. The registry entry is the only
required part; the demo and the docs improve the page rather than creating it.

### A package

```shell
pnpm new package my-package
pnpm run doctor --fix     # adds the Dockerfile manifest COPY line
pnpm install
```

The site globs `packages/*`, so it appears at `/packages/my-package` with its
README rendered. There is no list to update, which is the point: a list is a
thing that drifts, and the Dockerfile's hand-written one drifted twice before
the doctor started asserting it.

## How a package gets built

Five packages compile, and all five build the same way, because they all call
the same function:

```ts
// packages/<name>/tsdown.config.ts
import { defineConfig } from "tsdown";
import { library } from "../../tsdown.base.ts";

export default defineConfig(
  library({
    entry: { index: "./src/index.ts" },
    platform: "browser",
  }),
);
```

`tsdown.base.ts` holds everything that is not a per-package decision: both
formats, `es2023`, declarations, tree-shaking, source maps, shims, and the two
publishing checks. A package overrides what it genuinely differs on - entry
points, platform, which dependencies must stay external - and nothing else. The
merge is `defu`, so arrays concatenate: restating `format` would give you
`["esm", "cjs", "esm", "cjs"]`.

It is `tsdown.base.ts`, not `tsdown.config.ts`, on purpose. tsdown searches
parent directories for a config file, and a root `tsdown.config.ts` would be
found by every package that did not have its own. The base is a module you
import, not a config that leaks downward.

`pnpm run doctor` asserts the arrangement: a package that builds has a config, and a
config that exists imports the base. Opting out is allowed; opting out silently
is not.

### package.json is partly generated

`exports`, `main` and `module` are written by tsdown from the chunks it actually
emitted. Nobody maintains that map by hand any more, and this is why:
`packages/ui` published eleven subpaths pointing into a `dist/` its `files`
never shipped. Every one resolved in the repo, because in the repo the directory
exists. It is the tarball that was empty, and no diff shows you a tarball.

Two consequences:

- **A build can change `package.json`, and the change belongs in the commit.**
  CI runs `git diff --exit-code -- '**/package.json'` after building to say so.
  The manifests are a fixed point: build twice, get the same file.
- **`files` is still hand-written**, because nothing generates it. That is the
  one half of the arrangement a human can still get wrong, so the doctor checks
  the pair - exports naming `dist/` with a `files` that does not ship it is the
  original bug, and it now fails in seconds.

### publint and attw

Both run `ci-only`, from the shared base. publint reads the manifest against the
tarball; attw resolves the types the way each consumer's TypeScript will, on the
`node16` profile - nothing here supports `node10` resolution and failing a check
for a configuration no consumer runs is just noise.

They are the reason `@sushindustries/ui/registry` is compiled rather than
shipped as raw `.ts`: it is a module the site imports, and its own
`import type { IconName } from "./src/icon"` did not resolve under Node16 for
anybody who installed it. `pnpm run doctor` still reads `packages/ui/registry.ts` by
path, as text, so nothing about the installer changed.

`failOnWarn` is `ci-only` too. A warning that is genuinely acceptable gets
suppressed by name, next to the reason - see `suppressWarnings` in
`packages/react-product-viewer/tsdown.config.ts`.

### On the tsdown version

`0.22.14` is both the current latest stable release and the checkpoint version
the `tsdown-migrate` skill names: the last one that still accepts the deprecated
tsup compatibility options and warns about each. `0.23` removes them and ignores
leftovers *silently*. Nothing here uses one - the builds are warning-free - so
the upgrade is safe to take as soon as `0.23` ships stable. Do not take a beta
for it.

## The documentation surface

Everything below reads from the registry or the content catalogues, so none of
it is a second list to maintain.

- **Code material.** Fences are a charcoal terminal slab in both themes, with
  the CLI's xterm-256 palette as `--syn-*` tokens in atoms. The highlighter's
  `th-*` classes are styled once, in atoms - the day this lived in
  `apps/web/src/styles/prose.css` it silently outranked every `@layer` rule,
  because unlayered CSS beats layered CSS. Nothing unlayered may style a
  component again.
- **Utilities beat blocks.** Same lesson, other direction: a `.flex` utility in
  markup outranks a block rule's `display: none` in a media query, which is how
  the desktop nav kept rendering on phones. A class a breakpoint needs to take
  away must own its own layout.
- **The API tab is generated.** `packages/<pkg>/docs/<slug>/api.md` carries a
  `<!-- generated:api -->` fence, and what is inside it comes from the exported
  interface: names, types, defaults read out of the destructuring parameter,
  and the JSDoc as the description. So the `Does` column is a source comment,
  and improving a description means editing the interface - where it also
  reaches every consumer's editor. `pnpm run doctor --fix` regenerates; a file with
  no fence is reported and never rewritten, because inferring the boundary from
  headings once deleted eighteen lines of somebody's writing.
- **The five tabs are files.** `index`, `get-started`, `guides`, `api`,
  `examples`, in that order, and the tab bar is built from the ones that exist.
  Home is a shop window with a 350-word budget: over it, the page is carrying
  another tab, and the fix is `pnpm new docs <slug> guides` and moving whole
  sections. See `.claude/skills/document-an-element/SKILL.md`.
- **References.** Backticked mentions of registry items and packages become
  links wearing hover cards (`Ref` + the `references` prop on `MarkdownView`,
  fed by `references.catalogue.ts`). The doctor flags bare PascalCase mentions
  that should be references.
- **The agent surface.** `/agent-setup/prompt` routes an agent to
  `/r/prompt/<name>` (components) and `/r/prompt/packages/<name>` (packages);
  `/r/md/<name>` is any component page as Markdown. The URLs are extensionless
  because the dev pipeline classifies dotted paths as asset requests. Every
  component and package page carries the bar: Last updated (from `updated:`
  frontmatter), View as Markdown, Copy page, Claude / Cursor / Agent setup
  (all copy the same one-line prompt), Edit on GitHub.
- **Structured data.** `Breadcrumb` renders the visible trail and its
  schema.org `BreadcrumbList` from one array; component pages add
  `SoftwareSourceCode`, package pages `SoftwareApplication`
  (`structured-data.ts`).
- **Search.** `CommandPalette` in the nav, ⌘K or `/`, over every page,
  component, block, package and post. Open state is a TanStack Store because
  the trigger and the hotkey are unrelated writers.
- **Pages.** `pnpm new page <slug>` writes `content/pages/<slug>.md`; it ships
  at `/p/<slug>` with the full block layer. `draft: true` keeps it off.
- **Versioning and access.** Every registry item carries `version` (cited by
  installers, prompts and the generated page) and optionally
  `access: "pro"` - the endpoints answer 402 for pro items, so a paid tier is
  a check against a subscription, not a hunt through routes.
- **Heavy things wait.** three-loading islands import through
  `paced-import.ts`: a pacer queue, concurrency 1, started on idle - LCP wins,
  and viewers boot one at a time instead of losing WebGL contexts.
- **Lenis and inner scrolls.** Any `overflow: auto` container inside the page
  gets `data-lenis-prevent`, or the smooth scroller fights it.

## Templates

`templates/` holds the file each of those starts as. A template is Markdown
whose first block is an HTML comment naming its target and tokens; the comment
is stripped on render, so a template is a working preview of its own output.

The doctor derives which templates *should* exist rather than holding a list:
the fixed three that `pnpm new` can start, plus one per docs section that
`components.catalogue.ts` knows how to render. Add a section to the museum and
the doctor asks for its template.

## What the doctor checks

Structure, mostly - the things invisible in a diff and obvious in a directory.

- every workspace has a Dockerfile manifest `COPY`, a README, a description,
  and a tsconfig if it has a `typecheck` script
- every package that builds does it through `tsdown.base.ts`, and every package
  whose `exports` name `dist/` ships `dist` in its `files`
- no tracked file depends on a generated file without turbo declaring the order
- every registry item's files exist, are exported, resolve their registry
  dependencies, and have a docs page and a demo
- every `api.md` matches the interface it documents, and every documented
  element has a non-empty `summary:` - both repairable, because both copy
  something that already exists rather than inventing prose
- every doc file sits at `packages/<pkg>/docs/<slug>/<section>.md`, and every
  desktop icon label fits the tile it is drawn in
- every content file has the frontmatter its catalogue reads
- every class a `packages/ui` component uses is defined in `packages/atoms`,
  not in the site
- variants are data attributes, not modifier classes
- colours outside `:root` are tokens
- no em dashes

Adding a check is cheaper than remembering a rule. If something breaks twice,
it belongs in `scripts/doctor.mjs`.

## Going public

This pipeline is per-item - a post, a component, a package. Flipping the
repo's own visibility and publishing its packages is a once-per-lifecycle
event with its own procedure: `.claude/skills/going-public/SKILL.md`.
