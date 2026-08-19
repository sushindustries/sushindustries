# sushindustries

A TanStack Start site and the packages it is built from. One person's work, so
write copy in the first person singular - never "we", "our team", or "us".

## Read first

- `.claude/skills/sushindustries-conventions/SKILL.md` - the layout and naming
  rules this repo actually enforces. Read it before adding a file. Topic rules
  are in its `rules/`; read the one that matches the change, not all six.
- `.claude/pipeline.md` - how a post, a component or a package gets added, and
  which layer of checking catches what. Read it before pushing.
- The global `tanstack-start-architecture` skill - Official and Safety layers
  apply here in full. Its "Project convention" layer describes a different
  repo; the skill above is this repo's convention authority and outranks it.

<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

## Shape

```text
apps/web/          the site. TanStack Start on Vite + Nitro.
packages/atoms/    design tokens + atomic CSS. No build step.
packages/ui/       the components the site is made of. All installable.
packages/db/       Drizzle schema + client. Postgres.
packages/cli/      the adam-jurek command line, and the MCP server it serves.
plugins/           the Claude Code plugin this repo publishes. Not a workspace.
tsdown.base.ts     the one build every compiling package extends.
```

`plugins/` and `.claude-plugin/marketplace.json` are the one layout in this
repo not chosen by me: Claude Code requires the manifest at the root and the
plugin beside it, so neither can move into `packages/`. They are not pnpm
workspaces and `pnpm-workspace.yaml` deliberately does not glob them.

Every package that compiles does it through `tsdown.base.ts`, which also
generates that package's `exports`, `main` and `module` from the chunks the
build emitted. So **`package.json` is partly a build artefact**: if a build
rewrites one, commit the rewrite - CI diffs them. `files` is the half nothing
generates, and the doctor checks it against the half that is generated.

The rule that holds it together: **every visible element of the site is a
component in `packages/ui`.** The site is the first consumer of the library,
not a special case of it. If something is being built for a page, ask whether
it belongs in `ui` first - the answer is usually yes, and "it needs a prop for
that" is the fix, not a reason to keep it in the app.

Only genuinely site-specific things stay in `apps/web/src/modules/`: the nav,
the footer, the logo, the package catalogue.

## Commands

```bash
pnpm dev          # http://localhost:3000
pnpm new <kind> <slug>   # post, component or package, from templates/
pnpm run doctor       # what this repo is missing. --fix repairs what it can
pnpm check        # doctor, lint, types, build. What the pre-push hook runs
pnpm build
pnpm typecheck
```

## Adding a package

```bash
pnpm new package <name>
pnpm run doctor --fix   # adds the Dockerfile manifest COPY line
```

The site globs `packages/*` at build time, so it appears at `/packages/<name>`
with its README rendered. There is no list to update - except the Dockerfile's,
which Docker forces to be written by hand and which the doctor therefore
asserts.

## Deploy

Railway builds the root `Dockerfile` and runs the Nitro node server.
`/health` is the probe and checks nothing on purpose.
