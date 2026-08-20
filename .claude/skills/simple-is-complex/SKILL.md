---
name: simple-is-complex
description: The rule that complexity has to be earned, and the measurements that decide it - cycles, inversions, fan-out, depth and portability, read from the dependency graph by `pnpm sushindustries map`. Use before adding a package, before making one package depend on another, and when a change feels like it is spreading.
---

# Simple is complex

Simple is not the same as small, and it is much harder. A thousand lines in one
file that does one thing is simple. Two hundred lines spread across six
packages that must be released together is complex, and it will read as
"well-factored" to everybody who did not have to change it.

The distinction that matters here: **splitting is not simplifying.** Moving code
into a package makes the code somewhere else. It only simplifies if the thing
moved can now be understood, installed or replaced without the rest.

## The one question

> If somebody installed this package on its own, would it still mean anything?

Everything below is that question, measured.

## What the graph can prove

`pnpm sushindustries map` reads the workspace manifests and reports five
things. Two of them are wrong at any size; three are judgement with a number
attached.

| Signal | Means | Verdict |
| --- | --- | --- |
| **Cycle** | two packages that cannot be installed independently | always wrong |
| **Inversion** | a package depending on an app | always wrong |
| **Fan-out** | how much of the workspace comes with one piece | judgement |
| **Depth** | the longest chain, and so the longest rebuild | judgement |
| **Portability** | packages that install with nothing else from here | the score |

`pnpm run doctor` refuses the first two. It deliberately sets no threshold on
the others: a budget is a number somebody picked, and numbers somebody picked
get argued with rather than acted on. The map prints them so a person decides.

## Before adding a package

Answer all three. If any answer is "not yet", the code belongs where it is.

1. **Who outside this repository would install it?** Not "who might" - name
   them. A package nobody outside would take is a directory with extra
   ceremony: a manifest, a build, a README, a row in the Dockerfile.
2. **What does it need to be given rather than to know?** A package that
   reaches for this site's vocabulary, routes or copy has not been extracted;
   it has been moved. `packages/access` knows how to mint a token and
   deliberately does not know what a scope means, what an email should say, or
   where a link points - those stayed in the app.
3. **Does it shorten a chain or lengthen one?** Extracting something that then
   depends on three other internal packages has added a node to the graph and
   removed nothing from anybody's head.

## Before making one package depend on another

The dependency is the cost, not the code. Ask what the consumer now has to
take, and whether the shared thing is genuinely one idea or two ideas that
currently look alike. Two features sharing a directory because they were
written the same week is the failure this repository has already had.

## The smells, in the order they usually appear

- **A package with one consumer, forever.** It is a module in that consumer.
- **A "shared", "common" or "utils" package.** These have no subject, so
  nothing can ever be argued out of them, and they grow until every package
  depends on them - which is a cycle waiting for its second edge.
- **A registry that grows a field per feature.** Every feature must now be
  edited into a file that belongs to none of them.
- **A wrapper whose whole body is one call.** It costs a name, an import and a
  file, and it buys the ability to change something nobody has asked to change.
- **An abstraction with one implementation.** It is a guess about the second.

## What is not complexity

Long comments explaining why something is the way it is. Those are the most
expensive thing in a file to reconstruct and the cheapest to keep - see
`.claude/skills/simple/SKILL.md`'s "what not to simplify" for the same argument
about documentation that ran long.

A file that is long because the thing it describes is long. Splitting a
2,000-line module into five 400-line modules that all import each other has
made five files and one problem.

## Before you finish

- [ ] `pnpm sushindustries map` reports no cycle and no inversion.
- [ ] Any new package answers the three questions above out loud.
- [ ] Nothing was split that could not then be installed on its own.
