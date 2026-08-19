---
name: hypothesis-testing
description: >
  Turns an unverified belief about this site into a checked claim before
  anyone acts on it, recorded as one Markdown file per hypothesis. Use this
  skill when: (1) someone says "I think", "I bet", "probably because",
  "should fix it", or states any cause-and-effect claim about the code, a
  page or a metric that hasn't been checked yet, (2) a change is about to
  ship on the strength of a belief rather than a result, (3) explicitly
  asked to test, validate or run an experiment on a claim. Never ships a
  change on the hypothesis alone - the loop ends at PASSED, FAILED or
  INCONCLUSIVE, not a plausible story.
---

# hypothesis-testing

## The shape

```
Repository
  └── Hypothesis
        ├── Assumptions       └── Constraints
        ├── Predictions       └── Expected observations
        ├── Validation Tests  └── Assertions
        ├── Evidence          └── file / commit / diff / document
        └── Validation Result → PASSED | FAILED | INCONCLUSIVE
```

One Markdown file per hypothesis, at
`.claude/hypothesis-testing/records/<slug>.md` (gitignored - a working record
of one investigation, not shipped content). `record.py` is the only thing
that touches it: it reads and writes one named section at a time, so nothing
here requires opening the whole file to change one line, and nothing here
requires reading the whole file back to know what's still open.

## Commands

```
record.py new <slug>                        # create, all sections TODO
record.py get <slug> <section>               # print just that section
record.py set <slug> <section> "<text>"      # hypothesis, result: overwrite
record.py append <slug> <section> "<line>"   # constraints, observations, assertions
record.py evidence <slug> <file|commit|diff|document> "<ref>"
record.py result <slug> <PASSED|FAILED|INCONCLUSIVE>
record.py status <slug>                      # "pending: x, y" or "complete"
record.py show <slug>                        # whole file - use sparingly
record.py iterate <slug>                     # opens a fresh block below, history stays above
```

`status` and `get` are the default reads - both cost a line or two of
context. `show` dumps everything and is for when a human actually wants to
read the record, not a step in the normal loop.

## Filling it in - ask, don't assume

**Hypothesis, Constraints, Expected observations are the user's**. Ask for
them one at a time in chat, then `set`/`append` exactly what they said. These
are a belief and a prediction - writing one in for someone changes what's
being tested.

**Assertions are real, not prose.** When the hypothesis concerns this
codebase, write an actual Vitest test (`.claude/skills/vitest` for the API -
`expect().toBe()`, `.toContain()`, etc.) rather than a sentence describing
what should be true. An assertion that can't actually fail isn't one.
Record its path with `append <slug> assertions "<path>: <what it asserts>"`.

**Evidence is a pointer, not a paragraph.** The file the test lives in, the
commit that changed the behavior, a diff, or a document - `record.py
evidence` takes the kind and the reference, nothing freeform.

**Result is one of three tokens.** Read the evidence against Predictions,
not against what was hoped. INCONCLUSIVE is a legitimate answer - record it
rather than forcing PASSED or FAILED to close the loop early.

## Next iteration

`record.py iterate <slug>` appends a new block with every section reset to
`TODO`. Earlier attempts stay in the file above it - nothing is overwritten,
so the record is the history of every round, not just the latest guess.

## Self-healing: check `rules/` before inventing a check

`rules/01-*.md`, `02-*.md`, ... are hypotheses about this repo's own
structure that already have a canonical check and a known fix - a rule
never restates the reasoning, it points at `references/00-index.md` for
that. Before writing a new hypothesis about the codebase itself (not a
one-off page), look here first:

1. **A matching rule exists** - run its `Check` command directly as the
   Validation Test, skip re-deriving one from scratch.
2. **It fails** - the rule's `Fix` line is the scoped plan; propose exactly
   that fix and get confirmation before touching anything, same as always.
3. **No rule matches** - once the hypothesis resolves, add
   `rules/<next-number>-<keyword>.md` in the same format (Rule, Why, Check,
   Fix, Last checked + which record) so the next run of the same question
   doesn't start from zero.

A rule's "Last checked" line is a cache, not a guarantee - re-run its
`Check` rather than trusting a stale PASSED.
