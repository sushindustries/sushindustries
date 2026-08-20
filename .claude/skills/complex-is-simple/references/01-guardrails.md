# Guardrails that must not be removed

> Each of these was written after something went wrong, and each is cheap to
> delete when it is inconvenient. That is the point at which to read this file
> rather than the diff.
>
> Removing one is a decision, not a cleanup. If one is in the way, the question
> is what changed about the failure it was written for.

## Closed by default

| Guardrail | Where | Removing it means |
| --- | --- | --- |
| An unset auth token answers 503, never anonymously | `apps/web/src/modules/content/mcp-auth.server.ts` | a private endpoint quietly becomes public when a variable fails to load |
| Every endpoint names the scope it needs | same file, `refuse(request, scope)` | a read token can run workflows, which is a remote shell |
| A table must be classified before it reaches GraphQL | `GRAPHQL_EXPOSURE` in `packages/db/src/schema.ts` | credential tables are one forgotten decision from being public |
| The dev sign-in needs an opt-in variable *and* localhost | `apps/web/src/routes/auth.dev.ts` | a door that opens on any host that sets one variable |
| Secrets are stored hashed, shown once | `packages/access/src/tokens.server.ts` | "we cannot recover it for you" stops being true |
| Redemption is one conditional UPDATE | `packages/access/src/invites.server.ts` | one invitation mints two tokens under a double-click |

## Loud rather than convenient

| Guardrail | Where | Removing it means |
| --- | --- | --- |
| Tool replies are capped, and say they were cut | `packages/cli/mcp/core.mjs` | one call spends a context window and nothing says why |
| `--drift` runs on every edit and exits 2 | `.claude/settings.json` | drift is found at the gate instead of in the turn that caused it |
| The push gate runs the whole of `pnpm check` | `.husky/pre-push` | the first person to know is CI, or nobody |
| A generated file diffing dirty fails the build | `checkGeneratedFilesAreOrdered` | a clean checkout stops matching the committed tree |

## The rule about these rules

**A guardrail with no failure behind it is ceremony; a guardrail with one is
load-bearing.** Every row above names its failure. If you add one, name yours.

The reverse also holds: `.claude/skills/simplify/SKILL.md` exists to delete
things nothing needs. It does not license deleting these - "nothing has gone
wrong lately" is what a working guardrail looks like from the outside.

## Reading the repo without guessing

Ask the local MCP server rather than grepping. It needs no token and no
network, and it is registered by the `.mcp.json` at the repository root:

| Tool | Answers |
| --- | --- |
| `list-docs` | every Markdown document, by kind. Narrow with `kind` or `slug` |
| `read-doc` | one page, or one heading of it - `heading` returns that section alone |
| `search-docs` | which pages mention a phrase, and where in each |
| `list-collections` | named sets of documents, with what the whole set costs to read |
| `describe-workspace` | the dependency graph as facts |
| `draw-workspace` | the same graph as a chart |

`search-docs` before `read-doc`: knowing which page holds the answer is
cheaper than reading three that do not. Every reply is capped, so a tool that
returns a cut answer is telling you to narrow the question, not that the
document ended there.

Run one group alone with `pnpm sushindustries mcp <group>` -
`collections`, `docs`, `stack`, `graph` or `authoring`.
