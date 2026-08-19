---
name: going-public
description: The exact procedure this repo uses to flip from private to public and start publishing its packages - identity check, the REPO_IS_PUBLIC flag, the visibility switch, and the publish workflow. Use when asked to "make this repo public", "go public", "publish the packages", or to re-verify that visibility after the fact.
---

# Going public

Two different jobs, done in order. `open-sourcing` (a separate installed
skill) answers whether the repo is *ready* - secrets, licensing, CI hardening,
community-health files. This skill is what happens after that answer is yes:
the specific, repeatable mechanics this repo uses to actually flip, and how to
prove it worked.

Run `open-sourcing`'s readiness pass first if it has not run recently. This
skill does not repeat that audit. The `gh api` mechanics below - the
branch-protection dance in step 3, the identity check in step 1 - are the
general case of a more reusable skill, `gh-repo-admin`; this file is only
the order this repo runs them in.

## 1. Identity check

Before the repo is visible to anyone, confirm it is visible as *only* one
account:

```shell
gh api repos/sushindustries/sushindustries/collaborators?affiliation=all --jq '.[] | {login, permissions}'
gh api repos/sushindustries/sushindustries/keys --jq 'length'
gh auth status
git config user.name
git config user.email
```

Expect exactly one collaborator (`sushindustries`, admin), zero deploy keys,
and the active `gh` account and repo-local git identity both reading
`sushindustries`. This machine is logged into several unrelated GitHub
accounts at once - `gh auth status` lists all of them, only one is `active`,
and that is the one that authenticates a push. A stray commit under the wrong
identity is a `git config user.email` fix, not a GitHub settings problem.

## 2. The one flag

`apps/web/src/modules/content/repo.ts` has a single boolean,
`REPO_IS_PUBLIC`, and its own comment says why: everything that links to or
fetches the repo - the star count, the edit doors, every `codeRepository`
claim in structured data - reads it, so the day the repo opens is a one-line
change instead of a hunt through five files for URLs that quietly stopped
working. Flip it to `true`, run `pnpm doctor`, commit, push.

## 3. The switch itself

```shell
gh repo edit sushindustries/sushindustries --visibility public --accept-visibility-change-consequences
```

There is no partial version of this. GitHub does not offer a way to make the
code public while keeping the repo's Activity tab (the push log, including
any force-pushes) private - visibility is one switch, not two. Say so before
flipping it if that has not already been settled.

## 4. Publish the packages

`publish.yml` is `workflow_dispatch` only, on purpose - publishing is a
decision, not a side effect of a merge:

```shell
gh workflow run publish.yml
gh run watch <run-id> --exit-status
gh api "users/sushindustries/packages?package_type=npm" --jq '.[].name'
```

Expect every non-private workspace package back from that last command -
today that is `ui`, `atoms`, `assistant`, `db`, `llms`, `product-viewer`,
`react-product-viewer`. `adam-jurek` does not appear; it ships `private: true`
on purpose, and GitHub Packages skips it. If a package that should publish is
missing, that is the check worth starting from, not a re-run.

The shadcn and TanStack CLI registry doors (`/r/shadcn/*.json`,
`/r/tanstack/*.json`, `/r/registry.json`) are served by the site itself and do
not depend on repository visibility at all - they answer `200` whether the
repo is public or private. Nothing to trigger for those; a passing `curl` is
the whole check.

## Going back

`gh repo edit sushindustries/sushindustries --visibility private --accept-visibility-change-consequences`
reverses step 3 immediately - nothing about steps 1, 2 or 4 needs undoing,
since none of them are true only while the repo is public. Packages already
on GitHub Packages stay published; visibility on the repo they came from does
not retroactively unpublish them.
