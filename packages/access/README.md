# @sushindustries/access

Scoped API tokens and single-use invitations, over Postgres.

## Install

```bash
pnpm add @sushindustries/access
```

## What it is

Two credentials and the relationship between them. A **token** is a long-lived
bearer secret that belongs to an account, carries scopes, expires when it was
told to, and can be revoked on its own. An **invitation** is a short-lived
secret that produces one, at the moment somebody collects it - so what is sent
to a person is never itself a key to anything.

```ts
import { mint, verify, accountForLogin } from "@sushindustries/access/tokens.server";

const account = await accountForLogin("someone");
const { token } = await mint(
  { name: "their agent", scopes: ["docs:read"], expiresInDays: 90 },
  account,
);

// Later, on the gate:
const bearer = await verify(offered, "docs:read");
if (!bearer) return new Response("Unauthorized", { status: 401 });
```

## What it does not do

**It does not know what a scope means.** Scopes are strings: stored, split on
whitespace, compared for equality. Whether `docs:read` has a title and a
description is a question about one application's vocabulary, and a package
that answered it would be a package you had to fork to add a permission.

**It does not send anything.** `invite()` returns the secret and stops there.
The message that carries a link is somebody's copy, in somebody's voice,
through somebody's provider - and a package that owned the email would own all
three.

**It does not build URLs.** Where a link points is a route in your application.

## The two properties worth knowing

**A secret is never stored.** Only its SHA-256 and eleven characters of prefix,
which is enough to recognise a credential in a listing and useless for opening
anything. The plaintext exists once, in the return value of the call that
created it. "We cannot recover it for you" is a fact here rather than a policy.

**Redemption is one statement.** `UPDATE ... WHERE redeemed_at IS NULL ...
RETURNING` claims the invitation and reports whether this caller was the one
that claimed it, atomically - so a double-click, a retried request and a mail
scanner racing the recipient all produce exactly one token. A read-then-write
version behaves identically in every test written by one person clicking once,
which is what makes this worth stating out loud.

## Entries

| Import | Holds | Safe in a browser |
| --- | --- | --- |
| `@sushindustries/access` | types, constants, `splitScopes` | yes |
| `@sushindustries/access/tokens.server` | mint, verify, list, revoke, accounts | no |
| `@sushindustries/access/invites.server` | invite, preview, redeem, withdraw | no |

The `.server` suffix is in TanStack Start's client deny list, so the boundary
is enforced by the build rather than remembered by a reviewer.

## Requires

`@sushindustries/db` for the schema - `accounts`, `api_tokens` and
`magic_links` - and a `DATABASE_URL` for its client to read.
