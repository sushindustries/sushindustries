# Stage 01: intake

Everything here is content-defined. There is no index to update - the site
globs the source and renders whatever it finds. That makes exactly one
failure mode possible at intake, and it is invisible in a diff: a thing
exists in some of its link points and not the others, so the page renders
half of it and no single file looks wrong.

Intake is passed when every required link point holds the same slug.

## The contract

One slug is one name everywhere: the filename, the URL segment, the registry
id, the demo id and the preview route. Kebab-case, decided once.

**A component hands on:**

| Link point | Required | Because |
| --- | --- | --- |
| `packages/<pkg>/src/<slug>.tsx` | yes | the only copy of the source |
| exported from that package's `src/index.ts` | yes | nothing can import it otherwise |
| an entry in that package's `registry.ts` | yes | this alone produces the page |
| `docs/<slug>/index.md` with a `summary` | no | replaces the generated Home section |
| a demo keyed `<slug>` | no | adds the live preview and the archive thumbnail |

The registry entry is the only link that gates a page. A demo and docs
improve that page; they do not create it, and treating them as mandatory is
what once left seven of ten cards linking nowhere.

**A package hands on** a `package.json` with a real `description`, a
`README.md` (the package page *is* that file), and the `COPY` line in the
`Dockerfile` that nothing generates.

**A post or a page hands on** the frontmatter its catalogue reads: `title`
and `summary`. `draft: true` keeps it off the index; its absence publishes.

## The gate

```shell
python3 .claude/skills/01-pipeline/intake.py <slug>
```

It prints every link point, whether it is joined, and the one command that
joins it. Optional links are marked and never block.

It reads the repo and never writes. Two things repair, and the report names
which one applies per finding:

- `pnpm new <kind> <slug>` for a link point that has no file at all
- `pnpm run doctor --fix` for one that can be copied from somewhere else

Neither invents prose. A scaffold that fills a description with placeholder
text produces a file that looks finished and that `pnpm run doctor` can no longer
tell apart from a real one, so anything needing a sentence is left blank on
purpose and is mine to write.

## The action loop

1. Run the gate on the slug.
2. Exit `2`: nothing by that name exists. Start it with `pnpm new`.
3. Exit `1`: do the printed actions top to bottom. They are ordered by
   dependency - a registry entry naming a file that does not exist is a
   second broken thing, not a fix.
4. Write, by hand, whatever needed a sentence: the registry `description`,
   the docs `summary`, the JSDoc on each prop. Pin dependency versions in the
   registry entry; `latest` is how an install works for me and breaks for
   everyone else.
5. Re-run the gate until it exits `0`, then go to stage 02.

Do not go looking for the page in a running dev server to confirm this.
Adding or deleting route files leaves the server serving a stale route tree,
so a correct route 404s for that reason alone. That check belongs to stage
04, which boots the built server precisely because of this.

`add-a-component` is the skill that describes the writing itself - what goes
in the component, the rules that are not negotiable, and the shape of the
registry entry.
