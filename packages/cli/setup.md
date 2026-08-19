# Setup

What `pnpm sushindustries setup` says when a check does not pass.

The checks themselves are code, because they run commands and read files.
Everything below is the other half: what to do about a red one. That half is
prose, it changes far more often than the check does, and it should be
editable by anyone who has just been through the process and found a step
missing - without opening a `.mjs` file.

One `## heading` per check. The heading must match the check's `id` in
`commands/setup.mjs`; a heading with no check, or a check with no heading, is
reported by the wizard rather than passing silently.

Two tokens are substituted wherever they appear:

- `{origin}` - the site's URL, from `site.catalogue.ts`
- `{owner}` - the repository owner, from `repo.ts`

Neither is written down here on purpose. They are read from the files that
already hold them, so instructions cannot tell you to point an OAuth app at a
domain the site no longer uses.

## node

Install Node 22. It is what the Dockerfile runs, so it is the version the
deployment is actually tested against.

## pnpm

    corepack enable

Ships with Node. Nothing to download.

## install

    pnpm install

## refs

    pnpm sushindustries refs

Fetches each dependency's published `llms.txt` once and cuts it into local
shards. Takes a minute, and afterwards looking up somebody else's API is a
file read rather than a guess.

## railway

    brew install railway
    railway login
    railway link

Only `sync` and `studio` need it. Everything else in this CLI works without a
Railway account.

## database-url

Not needed for most commands. `pnpm sushindustries studio` builds the URL from
Railway on its own; `sync` is the one that wants it exported.

## mcp-token

The bearer token that opens `/mcp`, `/graphql` and `/studio` on the
deployment. Generate one and set it:

    node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
    railway variables --service web --set MCP_AUTH_TOKEN=<value>

Thirty-two random bytes. It is the only credential this deployment has, so it
should not be a word anybody could guess or a value reused from anywhere else.

## github-oauth

Open https://github.com/settings/developers and press **New OAuth App**. Four
fields, and these are the values:

    Application name          {owner} studio
    Homepage URL              {origin}
    Application description   (leave it empty)
    Authorization callback    {origin}/auth/github/callback

That callback must match **exactly** - scheme, host, path, no trailing slash.
GitHub rejects a mismatch with an error that does not say which character was
wrong.

Press **Register application**. The page then shows a Client ID and a
**Generate a new client secret** button. Take both; the secret is shown once
and never again.

Then paste them into this and run it:

    railway variables --service web \
      --set GITHUB_CLIENT_ID=<the Client ID> \
      --set GITHUB_CLIENT_SECRET=<the secret>

Run `pnpm sushindustries setup` again and this line turns green.

No scopes are requested. The only question this app asks GitHub is who you
are, and only **{owner}** is let through.

For signing in on localhost you need a second OAuth app with
`http://localhost:3000/auth/github/callback` as its callback, because GitHub
allows one callback URL per app. Or skip it: `/studio` takes the bearer token
locally, which needs no app at all.

## rover

Only needed to compose and test the connectors providers:

    curl -sSL https://rover.apollo.dev/nix/latest | sh
    pnpm sushindustries connectors

## mcp-registered

`.mcp.json` at the repo root registers the server when you open this directory
in Claude Code. Approve it once when prompted.

For the other ways in - the marketplace, the remote endpoint, or a manual
registration pointed at this checkout - run:

    pnpm sushindustries mcp install
