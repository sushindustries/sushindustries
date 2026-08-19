---
name: 01-pipeline
description: >
  The ordered stages a thing passes through in this repo, from "it does not
  exist" to "it is live", with the contract each stage has to hand the next
  one and the gate that proves it. Use this skill when: (1) asked to add,
  finish or fix a component, package, post or page and it is not obvious what
  is left to do, (2) something exists in code but its page looks wrong or
  empty, (3) asked what state a slug is in, (4) about to call a content or
  component task done. Routes to the skill that owns each stage rather than
  repeating it.
---

# The pipeline

Six stages. Each one takes what the one before it produced and refuses to
start without it, so "what do I do next" is always answered by the first gate
that fails rather than by remembering this file.

A stage owns a **contract**, not a task list. The contract is what the next
stage reads. The gate is a command that checks it, and the skill is where the
work itself is described. I do not duplicate that work here.

## The stages

| # | Stage | Hands on | Gate | Skill that owns it |
| --- | --- | --- | --- | --- |
| 01 | intake | a slug wired into every link point | `intake.py <slug>` | `add-a-component` |
| 02 | document | every tab that exists carries its contract | `pnpm run docs --slug <slug>` | `document-an-element` |
| 03 | conform | atoms classes, tokens, generated manifests | `pnpm run doctor` | `sushindustries-conventions` |
| 04 | verify | the served page renders and responds | `pnpm test` | `verify-component`, `toolset` |
| 05 | prune | nothing dead, nothing unread, nothing bloated | `pnpm run doctor` | `simplify` |
| 06 | ship | types, build, CI, deploy | `pnpm check` | `.claude/pipeline.md` |

Only stage 01 is built out as a stage document so far, in
`stages/01-intake.md`. The rest route straight to the skill in the last
column, which is why the table is short: a stage whose skill already says
everything does not need a second page saying it again.

## How to use this

1. Find the lowest-numbered stage whose gate fails. That is the state the
   thing is in, whatever anyone said it was.
2. Open that stage's skill and do the work it describes.
3. Re-run the gate. Do not skip ahead on the strength of a plausible story -
   a later gate reading a broken earlier contract reports a confusing failure
   in the wrong place.

Running a later gate first is not wrong, only wasteful: `pnpm check` will
fail on a component that never got a registry entry, and it takes a minute to
tell you what `intake.py` says in a second.

## Stage 01, intake

The one gate that is a script here rather than a repo command, because
nothing else in the repo answers it. `pnpm run doctor` checks every rule across
the whole repo and only sees a component once the registry knows about it.
This traces one slug, including one the registry has never heard of, which is
the state a half-finished thing is actually in.

```shell
python3 .claude/skills/01-pipeline/intake.py <slug>          # the report
python3 .claude/skills/01-pipeline/intake.py <slug> --json   # for a tool to read
```

Exit codes: `0` the contract is met, `1` a required link is missing, `2` no
such slug anywhere.

It never writes. Repairs are `pnpm run doctor --fix` and `pnpm new`, both of
which the report names per finding, and both of which only copy what already
exists somewhere rather than inventing prose. See `stages/01-intake.md` for
the contract per kind and the action loop.

## Adding a stage

A stage earns a document when its contract is not already a skill's opening
paragraph. Write `stages/NN-name.md` with the same three headings the intake
document uses - contract, gate, action loop - add the row above, and stop.
The gate goes in this folder as a script only if no repo command can answer
it; otherwise the gate is that command and there is nothing to write.
