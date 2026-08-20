---
name: complex-is-simple
description: |
  Make a large system safe to be large: derive what can be derived, check what
  cannot, and know which rules are still held by memory. The counterpart to
  simple-is-complex.
  Use when (a) adding a list, count or name that exists somewhere else,
  (b) writing a rule into a comment, (c) a comment turns out to be wrong, or
  (d) choosing between a check and a convention.
  Trigger with phrases like "will this drift", "is this checked", "who
  enforces this", "should this be generated", "second copy".
---

# Complex is simple

> Complexity is not the number of parts. It is the number of things that can
> silently disagree.

Fifty checks and twelve packages are not complicated if none can drift. Two
files are complicated if one lies and nothing says so - which this repo has
shipped repeatedly: a comment citing a test that never existed, a map four
packages behind, a help text promising seventeen tools while the server served
twenty-two. All small, all correct-looking, all invisible in the diff.

## Three answers, best first

**1. Derive it.** The best second copy is no second copy. Workspace roots come
from `pnpm-workspace.yaml`, the tool count from the registered groups, the
versions from the manifests.

The rule each time: **generate the half a machine can know, hand-write the half
it cannot, and carry the second across.** A version can be derived; why the
dependency is here cannot. Never invent the second half.

**2. Check it.** When two copies genuinely must exist - `DocumentKind` lives in
four places because a type cannot be iterated - make them answerable.

**3. Write it down and say nobody checks it.** The honest last resort. The
conventions skill marks 22 rules `nobody`; that column is the backlog.

## The drifter

```bash
pnpm run doctor --drift    # 7 checks, ~0.24s, runs on every edit
pnpm run doctor            # all 54, ~1.2s
```

- [ ] generated files are ordered
- [ ] `DocumentKind` agrees across its four declarations
- [ ] no cycle, no package depending on an app
- [ ] `stack.yaml` matches what is installed
- [ ] frontmatter is what each of command, skill and agent needs
- [ ] the intent maps account for every public package
- [ ] a cited file exists

## The tools

| Command | Keeps in step |
| --- | --- |
| `pnpm sushindustries pipeline` | schema, projection and graph - only what is stale |
| `pnpm sushindustries map` | the shape; `--json` for an agent, `--mermaid` for a person |
| `pnpm sushindustries intent --sync` | the intent maps, reasons preserved |
| `pnpm sushindustries stack --sync` | the versions, purposes preserved |
| `pnpm sushindustries graphql` | the schema, refusing an unclassified table |

Over MCP, locally, no token: `describe-workspace`, `draw-workspace`.

## Before adding a list, a count or a name

- [ ] Does this value exist already? Read it, do not repeat it.
- [ ] If it must be repeated, what fails when the copies disagree - and does
      anything say so?
- [ ] If not, write the check. It is usually cheaper than the rule.

**Never state a number you did not count.** **Never cite a file you have not
opened.**

## The other half

`simple-is-complex` refuses complexity that is not earned. This one makes
earned complexity survivable. Two references sit beside this
one: `00-what-enforces-what.md` maps every claim here to the file that makes it
true, and `01-guardrails.md` lists the rules that must not be removed and how
to ask the local MCP server about any of it.
