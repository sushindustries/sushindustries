# What enforces what

> Every claim in this skill, and the file that makes it true. If a row here is
> wrong, the skill is lying - which is the failure the skill is about, so fix
> the row first.
>
> The paths are checked. `checkCitedFilesExist` in `scripts/doctor.mjs` reads
> every backticked path in a code comment and requires it to exist; this file
> is prose rather than code, so it is on the honour system, and the honour
> system is exactly what the rest of this argues against. Re-read it when a
> path here stops resolving.

## Derived, so it cannot drift

| Claim | Read from | Written by |
| --- | --- | --- |
| workspace roots | `pnpm-workspace.yaml` | `packages/cli/commands/map.mjs` |
| tool groups in the CLI help | `packages/cli/mcp/index.mjs` | `packages/cli/adam-jurek.mjs` |
| which tables reach GraphQL | `GRAPHQL_EXPOSURE` in `packages/db/src/schema.ts` | `packages/cli/commands/graphql.mjs` |
| package versions | every workspace manifest | `packages/cli/commands/stack.mjs` |
| intent map coverage | `packages/*/skills/*/SKILL.md` | `packages/cli/commands/intent.mjs` |
| directories a citation may name | the tracked files | `scripts/doctor.mjs` |
| the dependency graph | every workspace manifest | `packages/cli/commands/map.mjs` |

## Checked, because two copies must exist

| Claim | Copies | Checked by |
| --- | --- | --- |
| `DocumentKind` agrees | 4: the union, the array, the MCP classifier, the GraphQL enum | `checkDocumentKindsAgree` |
| the graph is acyclic | manifests | `checkGraphIsAcyclic` |
| `packages/cli/stack.yaml` is current | the file and the manifests | `checkStackVersionsAreCurrent` |
| frontmatter per kind | commands, skills, agents | `checkAuthoredFrontmatter` |
| the intent maps cover the workspace | 2 YAML files | `checkDomainMapCoversPackages` |
| a cited file exists | every code comment | `checkCitedFilesExist` |
| a clean checkout produces no diff | generated files | `checkGeneratedFilesAreOrdered` |

All seven run on every edit, through the `PostToolUse` hook in
`.claude/settings.json`, and at the gate through `pnpm check`.

## Enforced by nobody

The conventions skill marks 22 rules `nobody` in its `rules/` tables. That
column is not an embarrassment, it is the backlog: **a rule that matters and is
enforced by nobody is the next check to write.** Read
`.claude/skills/sushindustries-conventions/SKILL.md` for how that column works.

Two known blind spots, both found by being wrong rather than by looking:

- **Manifest edges are not every edge.** `packages/github` is found by
  `packages/cli/commands/connectors.mjs` looking for a `schema.graphql`, and
  showed in the graph as used by nobody until `discovered()` was added. An
  agent read that and called a live package dead weight.
- **Tools cannot see config-declared consumers.** A hook names its script in
  JSON rather than importing it, so `knip` reported a shipped hook script as
  unused. Declared as an entry in `knip.jsonc`.

The lesson both taught: **a tool that cannot see an edge reports its absence
with the same confidence as a fact.** When a tool says something is unused,
ask how that thing is reached before believing it.

## Where each tool's own reasoning lives

- `packages/cli/commands/map.mjs` - why the graph is drawn from manifests, and
  what `discovered()` exists to catch.
- `packages/cli/commands/pipeline.mjs` - why each stage tests its own
  staleness, and why it returns a sentence rather than a boolean.
- `packages/cli/mcp/core.mjs` - why the token budget lives in the one function
  every tool returns through.
- `packages/db/src/schema.ts` - why a new table must be classified before the
  GraphQL schema will generate.
