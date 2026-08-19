---
name: gh-repo-admin
description: Safe patterns for editing a GitHub repo's settings from the command line with gh api - toggling branch protection to allow a one-off force-push and restoring it after, flipping repo visibility, enabling features like Discussions, and checking things a GitHub UI page shows but no simple REST field exposes (Sponsors enrollment, social preview). Use whenever a task needs gh api -X PATCH/PUT against a repo's settings rather than its content.
---

# GitHub repo administration via `gh api`

Patterns this repo actually used to set itself up, not a full REST
reference. Reach for `gh api -X PATCH repos/<owner>/<repo>` for a
single boolean setting; the branch-protection PUT is the one exception
that needs a full-object replace.

## The one setting that is a full replace, not a patch

`PUT /repos/{owner}/{repo}/branches/{branch}/protection` replaces every
field at once - there is no partial-update endpoint for branch protection.
Read the current state first, change only what you mean to, and write the
whole object back, or you silently drop every field you did not list:

```shell
gh api repos/<owner>/<repo>/branches/main/protection
```

To allow a single force-push (a history rewrite, a squash) and put the
door back afterward:

```shell
cat <<'EOF' | gh api -X PUT repos/<owner>/<repo>/branches/main/protection --input -
{
  "required_status_checks": {"strict": false, "contexts": ["<your required check name>"]},
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": true,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false,
  "allow_fork_syncing": false
}
EOF

git push --force origin main

# same body again, allow_force_pushes back to false
```

Do the push immediately after enabling, and restore immediately after the
push succeeds - the window where force-push is open is the window where a
second bad push is also possible.

## Single-field settings - a PATCH, not a PUT

Most repo settings are a plain field on the repo object, changeable one at
a time without touching anything else:

```shell
gh api -X PATCH repos/<owner>/<repo> -f has_discussions=true
gh repo edit <owner>/<repo> --visibility public --accept-visibility-change-consequences
```

`gh repo edit --visibility` requires the consequences flag on purpose - read
them once (`gh io/setting-repository-visibility`) rather than every time.
There is no partial version of visibility: GitHub does not offer a way to
make code public while keeping the repo's Activity tab (the push log)
private. They are the same switch.

## Things the REST API will not tell you, and how to actually check

- **GitHub Sponsors enrollment.** No REST field for this. GraphQL does:
  ```shell
  gh api graphql -f query='{ user(login: "<login>") { hasSponsorsListing } }'
  ```
  `false` means adding `github: <login>` to `FUNDING.yml` renders a button
  that does not work - enrollment is an application only the account owner
  can complete (identity, tax, banking), not something to automate around.

- **Social preview image.** `repos/{owner}/{repo}/social-preview` 404s
  whether or not one is set - the endpoint does not exist for GET or PUT.
  Uploading one is Settings-page-only. The reusable half is generating the
  image itself (crop a real screenshot to 1280×640, PNG, under 1 MB) and
  committing it, so the human step is "upload this file" instead of
  "design an image."

- **Which account is actually pushing.** A machine can be logged into
  several `gh` accounts at once; only one is `active`. `gh auth status`
  lists all of them. `git config user.email` is a separate, per-repo
  setting from any of that - check both before trusting a commit's
  identity, especially right after cloning or switching machines.

## Packages published from a repo

```shell
gh api "users/<owner>/packages?package_type=npm" --jq '.[].name'
```

Confirms what actually landed on GitHub Packages after a publish workflow
runs - a workflow reporting green does not by itself prove the package is
there under the name expected.
