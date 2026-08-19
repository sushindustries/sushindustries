---
name: sushindustries-conventions
description: Layout, naming and boundary rules for the sushindustries monorepo - where a new file goes, what it is called, and which of apps/web, packages/ui, packages/atoms or packages/db owns it. Use before adding or moving any file in this repo, and before writing site copy. Topic rules live in rules/; read the one that matches the change.
---

# sushindustries conventions

> This repo's convention authority. Read the rule file that matches the change,
> not all of them.

## The rule that decides most questions

**Every visible element of the site is a component in `packages/ui`.**

The site is the library's first consumer, not a special case of it. Before
adding a component to `apps/web`, ask whether someone installing
`@sushindustries/ui` would want it. Usually they would, and the objection
"but it needs to know about X" is answered with a prop, not with a copy in the
app.

Everything in `rules/` is that rule applied to one surface.

## Authority

| Source | Outranks | On |
| --- | --- | --- |
| The user, and `CLAUDE.md` | everything here | anything |
| Official TanStack docs | this skill | framework API facts |
| This skill | the global `tanstack-start-architecture` skill | where a file goes, what it is called |
| The global skill's Official and Safety layers | nothing here contradicts them | loaders, import protection, hydration |

The global skill's **Project convention** layer describes a different repo: it
prefers route directories with `-components/` and `-hooks/`, and a
`src/modules/<domain>/<feature>/` server layer. That shape is not wrong, it is
somebody else's. Where the two disagree about layout, this file wins.

## How a rule is written here

Every rule carries two labels, because they answer different questions.

**Layer** - where the rule comes from, and how much room there is to argue:

- **Official** - documented framework behaviour. Breaking it breaks the build
  or the URL. Not negotiable.
- **Safety** - a secret, a boundary or a first render. Blocking.
- **House** - a choice I made. Stricter than the framework needs. Negotiable
  in principle, and consistent in practice.

**Enforced by** - what actually catches a violation, which is the honest half:

| Value | Means |
| --- | --- |
| `doctor` | `pnpm run doctor` fails, naming the file. Often `--fix` repairs it |
| `tests` | `pnpm test` fails against the built server |
| `types` | `tsc` fails |
| `build` | the build fails, usually import protection |
| `CI` | only a clean checkout catches it |
| **`nobody`** | nothing checks this. It holds because someone remembers |

`nobody` is the useful column. A rule that matters and is enforced by `nobody`
is a candidate for `scripts/doctor.mjs` - `.claude/pipeline.md` puts it
plainly: adding a check is cheaper than remembering a rule, and if something
breaks twice it belongs in the doctor.

## The rules

| File | Read it before |
| --- | --- |
| `rules/00-gates.md` | **anything.** What blocks, the layer order, and what may be fixed without asking |
| `rules/01-placement.md` | adding or moving any file - which package owns it, what it is called, which suffix it takes |
| `rules/02-routes.md` | adding a route, a URL, or anything under `apps/web/src/routes/` |
| `rules/03-styling.md` | writing CSS, adding a class, or adding a variant to a component |
| `rules/04-documentation.md` | writing or fixing a docs page for a component or package |
| `rules/05-voice.md` | writing site copy, a README, or a comment |
| `rules/06-motion.md` | animating anything, or touching scroll |

## The references

`rules/` says what to do. `references/` says what is true, and when it was
last checked, so a framework fact is refreshed in one file rather than hunted
through six.

| File | Holds |
| --- | --- |
| `references/00-index.md` | source priority - installed types beat docs pages |
| `references/01-tanstack-official.md` | official Start and Router behaviour, against our versions |
| `references/02-api-drift.md` | where the published docs and the installed types disagree |
| `references/03-current-state.md` | this repo audited against the gates, with evidence |

Related, and not in this skill:

- `.claude/pipeline.md` - how a change gets from written to deployed, and which
  layer of checking catches what. Read before pushing.
- `.claude/skills/document-an-element/SKILL.md` - the full documentation
  contract, including word budgets.
- `.claude/skills/add-a-component/SKILL.md` - the steps for a new component.

## Before you finish

- [ ] The change went into the package that owns it, not the one that needed it
      first.
- [ ] `pnpm run doctor` passes. If it repaired something, the repair is in the
      commit.
- [ ] A new rule learned the hard way was written into the matching
      `rules/` file, with the command that proves it and the date.
- [ ] Nothing new is enforced by `nobody` without saying so.
