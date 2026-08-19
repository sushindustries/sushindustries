---
name: 01-pipeline
description: >
  The ordered stages a thing passes through in this repo, from "it does not
  exist" to "it is live", with the contract each stage hands the next one and
  a runnable gate that proves it. Use this skill when: (1) asked to add,
  finish or fix a component, package, post or page and it is not obvious what
  is left to do, (2) something exists in code but its page looks wrong or
  empty, (3) asked what state a slug is in, (4) about to call a content or
  component task done. Routes to the skill that owns each stage rather than
  repeating it.
---

# The pipeline

Six stages. Each takes what the one before produced and refuses to start
without it, so "what do I do next" is answered by the first gate that fails
rather than by remembering this file.

A stage owns a **contract**, not a task list. The contract is what the next
stage reads. The gate is a command that checks it. The skill is where the work
itself is described, and I do not duplicate that work here.

## Run the whole thing

```shell
python3 .claude/skills/01-pipeline/pipeline.py <slug>          # the cheap gates
python3 .claude/skills/01-pipeline/pipeline.py <slug> --deep   # including the slow ones
python3 .claude/skills/01-pipeline/pipeline.py <slug> --json   # for a tool to read
python3 .claude/skills/01-pipeline/pipeline.py <slug> --stage 2
```

It runs the gates in order and **stops at the first failure**, then names the
skill that owns that stage. That is the point of the ordering: a later gate
reading a broken earlier contract reports a confusing failure in the wrong
place. `pnpm check` fails on a component with no registry entry, and it takes
a minute to say what stage 01 says in a second.

Exit codes: `0` everything that ran passed, `1` a gate failed, `2` no such
slug.

## The stages

| # | Stage | Hands on | Gate | Skill that owns it |
| --- | --- | --- | --- | --- |
| 01 | intake | a slug wired into every link point | `intake.py` (internal) | `add-a-component` |
| 02 | document | every tab that exists carries its contract | `pnpm run docs --json` | `document-an-element` |
| 03 | conform | atoms classes, tokens, generated manifests | `pnpm run doctor` | `sushindustries-conventions` |
| 04 | verify | the served page renders and responds | `pnpm test` | `verify-component`, `toolset` |
| 05 | prune | the docs home is still a shop window | word budget | `simplify` |
| 06 | ship | types, build, CI, deploy | `pnpm check` | `.claude/pipeline.md` |

Stages **04 and 06 are skipped unless `--deep`**. They boot a built server and
run a full build, a minute or more each. They announce that they were skipped
rather than reporting a pass, because a gate nobody runs because it is slow is
worse than one that says it did not run.

Stage 01 is written out in `stages/01-intake.md`. The rest route straight to
the skill in the last column: a stage whose skill already says everything does
not need a second page saying it again.

## After the push: watching what it cost

```shell
python3 .claude/skills/01-pipeline/ci.py                  # watch HEAD until it stops
python3 .claude/skills/01-pipeline/ci.py --max-seconds 300
python3 .claude/skills/01-pipeline/ci.py --sha <sha> --json
```

`--max-seconds` is **seconds of running time**, not money. The distinction it
draws is the useful one: a run sitting in the queue is free and is waited on,
a run that has started is billed and is capped. Both look identical to
somebody refreshing a browser tab, which is how a hung job bills until
GitHub's own six-hour timeout.

Two things it cancels without asking. Anything still running past the cap, on
the grounds that a job which has doubled its usual time has hung rather than
slowed. And every Codespaces Prebuild, always: it rebuilds a container on
each push to the default branch, nothing here has a `.devcontainer` for it to
prebuild, and GitHub refuses to disable a dynamic workflow through its API,
so cancelling each one as it appears is the only lever left.

A failure prints the first `##[error]` line from the log rather than a link to
go and read, because the reason is the thing you wanted.

## Which gates need a prepared repo, and which do not

A hard dependency and a soft one are different things, and only the hard one
earns a pointer.

Stages **01 and 05 read the filesystem**. They work on a fresh clone with
nothing installed, which is exactly the state a half-finished thing tends to
be found in. Stages **02, 03, 04 and 06 shell out to pnpm scripts**, and
without `node_modules` they fail with a resolution error that says nothing
about the real problem. Those four, and only those four, check first and say
`run pnpm install`.

Putting that pointer on the other two would be a line nobody needs, in a
place it is not load-bearing, which is how a caveat gets cargo-culted and
then believed.

## Using these skills from another project

```shell
pnpm skills:link            # symlink every skill here into ~/.claude/skills
pnpm skills:link --unlink   # remove only the links it made
```

Symlinks rather than copies, because a copy is a second version of a skill
that drifts from this one while both files still look authoritative. A name
that collides with a real directory already in `~/.claude/skills` is skipped
and reported, never deleted; `--force` is the way to say you meant it.

## Two commands that do not work as written

`pnpm doctor` and `pnpm docs` collide with **pnpm's own builtins**, so the bare
forms never reach `scripts/doctor.mjs` or `scripts/docs-report.mjs`. Always
`pnpm run doctor` and `pnpm run docs`. This gate uses the working form; the CI
Doctor step and the root `check` script always did.

## Stage 01, in a little more detail

The one gate that is a script rather than a repo command, because nothing else
answers it. `pnpm run doctor` checks every rule across the whole repo and only
sees a component once the registry knows about it. This traces one slug,
including one the registry has never heard of, which is what a half-finished
thing actually is.

```shell
python3 .claude/skills/01-pipeline/intake.py <slug>
```

It never writes. Repairs are `pnpm run doctor --fix` and `pnpm new`, both of
which the report names per finding, and both of which copy something that
already exists rather than inventing prose.

## The tests

```shell
python3 .claude/skills/01-pipeline/test_pipeline.py
```

Standard library only, no network. The cheap gates run against the real repo
rather than a fixture, because a fixture passes while the thing it stands for
drifts, which is the failure this pipeline exists to catch. One test asserts
that **every registry item passes intake**, so this gate can never become
quietly stricter than the repo it checks.

They earn their place. The first run caught `frontmatter()` matching with
`\s*`, which spans newlines, so an empty `summary:` captured the `---` closing
the block and read as present. An empty field passing a presence check is the
exact false pass the gate exists to prevent.

## Adding a stage

A stage earns a document when its contract is not already a skill's opening
paragraph. Write `stages/NN-name.md` with the same three headings the intake
document uses (contract, gate, action loop), add a function to `STAGES` in
`pipeline.py`, add the row above, and add a test. The gate goes in this folder
as a script only when no repo command can answer it; otherwise the gate is
that command and there is nothing to write.
