# turbo.json, and the one exclusion that is safe

`turbo.json` rejects unknown keys, `//` included, so the reasoning that would
normally sit in the file lives here.

## Tests are excluded from `build` and `transit` inputs

No build reads a test. Editing one used to change the build hash of the
package it sits in, which for `apps/web` meant a full rebuild and a prerender
of every page to run a test that could not have been affected by it.

**Both tasks, or neither.** Excluding them from `build` alone changes nothing:
`build` depends on `transit`, `transit` hashed every file including tests, and
a changed dependency hash changes the dependent's. The first attempt did
exactly that and the build hash moved anyway - which is the useful shape of
that failure, because a task's inputs are only as narrow as the inputs of
everything it depends on.

Measured after: editing a test leaves `web#build` unchanged and moves
`web#test`, which is the whole point.

## Documentation is **not** excluded, and that is deliberate

Excluding it looks like the obvious next win. `packages/ui/docs` has nothing
to do with `tsdown`, so rebuilding that package because an `api.md` changed
reads as pure waste.

It is not waste. The site globs every package's docs at build time, and the
way it learns a doc changed is that the upstream build hash moved. Exclude the
docs and the package build gets cheap while the site serves the previous
version from cache - a stale page, silently, behind a green CI.

Verified rather than reasoned about: append a marker to
`packages/ui/docs/card/api.md`, run `pnpm turbo run build --filter=web`, and
grep `.output` for it. It is there.

## What the cache already covers

`hashOfExternalDependencies` is computed from the lockfile natively, so
`pnpm-lock.yaml` does not need to be a `globalDependency` - adding it would be
belt and braces on something turbo already does. Checked with
`--dry=json`, which prints the inputs it hashed.

## The local cache grows without limit

CI trims `.turbo/cache` on every run and a laptop never does; it reached 1.1 GB
here. `rm -rf .turbo/cache` costs one slow build and nothing else.
