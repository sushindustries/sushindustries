# The pipeline

From "I want to add something" to "it is live", and what stops each step from
costing money it did not need to.

## The four commands

```shell
pnpm new <post|component|package|glyph> <slug>   # start it from a template
pnpm doctor                                      # what is missing
pnpm doctor --fix                                # repair what can be repaired
pnpm check                                       # doctor, lint, types, build
```

`pnpm check` is what `.githooks/pre-push` runs. The hook installs itself: the
root `prepare` script sets `core.hooksPath` to `.githooks`, so a clone gets it
from `pnpm install` with no husky and no dependency. It can be bypassed with
`git push --no-verify`, because a hook you cannot bypass is a hook people
delete.

## Where the checking happens, and why there

Each layer catches what the layer before it cannot see, and costs more than it.

| Layer | Runs | Catches | Costs |
| --- | --- | --- | --- |
| `pnpm doctor` | seconds, no build | missing docs, missing Dockerfile lines, a class defined nowhere | nothing |
| `pnpm check` | pre-push | types, import protection, a build that does not build | a minute |
| CI `check` | on push and PR | the same, in a clean checkout | GitHub minutes |
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
pnpm doctor --fix     # adds the Dockerfile manifest COPY line
pnpm install
```

The site globs `packages/*`, so it appears at `/packages/my-package` with its
README rendered. There is no list to update, which is the point: a list is a
thing that drifts, and the Dockerfile's hand-written one drifted twice before
the doctor started asserting it.

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
- no tracked file depends on a generated file without turbo declaring the order
- every registry item's files exist, are exported, resolve their registry
  dependencies, and have a docs page and a demo
- every content file has the frontmatter its catalogue reads
- every class a `packages/ui` component uses is defined in `packages/atoms`,
  not in the site
- variants are data attributes, not modifier classes
- colours outside `:root` are tokens
- no em dashes

Adding a check is cheaper than remembering a rule. If something breaks twice,
it belongs in `scripts/doctor.mjs`.
