---
name: core
description: >
  How @sushindustries/access splits a client-safe entry point from two
  server-only ones, why an invitation must be redeemed by a POST and never a
  GET, and why a secret can be shown exactly once. Load when minting or
  verifying an API token, building an invitation flow, or writing the gate on
  a route that a token is meant to open.
metadata:
  type: core
  library: '@sushindustries/access'
  library_version: '0.1.0'
sources:
  - 'sushindustries/sushindustries:packages/access/README.md'
---

## Setup

```ts
// Safe anywhere - types, scope constants, splitScopes. No database.
import { type Scope, splitScopes } from "@sushindustries/access";

// Server only - both of these read DATABASE_URL and hold secrets.
import { mint, verify, accountForLogin } from "@sushindustries/access/tokens.server";
import { invite, preview, redeem } from "@sushindustries/access/invites.server";
```

## Core Patterns

### A token is minted against an account, and the account is found or created

```ts
const account = await accountForLogin("someone");        // github login
const account = await accountForEmail("a@example.com");  // proved by receiving
const { token, summary } = await mint(
	{ name: "their agent", scopes: ["docs:read"], expiresInDays: 90 },
	account,
);
```

`token` is the plaintext, and this return value is the only place it will
ever exist. `summary` is what everything downstream holds: an id, a name, a
prefix, and the scopes.

Two functions rather than one with a `by` argument, because the field is not a
parameter of the idea - a login was asserted by an identity provider, an email
was proved by receiving something at it.

### The gate is one call, and its answer is the whole decision

```ts
const offered = bearerFrom(request);
const bearer = offered && (await verify(offered, "docs:read"));
if (!bearer) return new Response("Unauthorized", { status: 401 });
```

`verify` refuses for four reasons - no such hash, revoked, account blocked,
expired - and returns the scopes and holder when it does not. Three of the
four are in the query, so a row failing one never becomes a value the function
is holding.

### An invitation is previewed on GET and spent on POST

```ts
// loader: what this link would produce
const offer = await preview(secret);

// action: spend it
const minted = await redeem(secret);
```

`preview` reads without consuming. `redeem` claims the row with
`UPDATE ... WHERE redeemed_at IS NULL ... RETURNING` and mints inside that
claim, so a caller that lost the race produces nothing rather than a second
token.

## Common Mistakes

### [CRITICAL] Redeeming an invitation from a loader, or any GET

Wrong:

```ts
export const Route = createFileRoute("/access/$secret")({
	loader: ({ params }) => redeem(params.secret),
});
```

Correct: `preview()` in the loader, `redeem()` in a server function the person
submits to.

A link sent to somebody is followed by things that are not that person - mail
scanners, link previews, the antivirus in a mail client, the browser
prefetching a hovered link. Every one of them issues a GET, and against a
single-use credential every one of them consumes it before the recipient sees
the page. The failure looks like "the link was already used" with nobody
having used it, which is close to impossible to reproduce on demand.

Source: sushindustries/sushindustries:packages/access/README.md (The two properties worth knowing)

### [CRITICAL] Storing, logging or re-displaying the plaintext token

Wrong:

```ts
const { token } = await mint(request, account);
await db.insert(auditLog).values({ event: "minted", detail: token });
console.log("minted", token);
```

Correct: pass `token` to the response that shows it once, and keep
`summary.prefix` for anything that has to recognise it later.

Only the SHA-256 and eleven characters of prefix are stored, which is what
makes "it cannot be recovered" a fact about this package rather than a policy
somebody could decide to relax. A log line or an audit row undoes that for
every credential the system has ever issued, in a place with a longer
retention than the table it was protecting.

Source: sushindustries/sushindustries:packages/access/README.md (The two properties worth knowing)

### [HIGH] Reading the invitation first and updating it second

Wrong:

```ts
const row = await findLink(secret);
if (!row.redeemedAt) {
	await markRedeemed(row.id);
	return mint(/* ... */);
}
```

Correct: claim and report in one statement, which is what `redeem()` already
does - call it rather than reimplementing the flow around `preview()`.

The wrong version behaves identically in every test written by one person
clicking once. It fails under a double-click, a retried request, or a scanner
racing the recipient, and it fails by minting two live credentials from one
invitation - the outcome the single-use property exists to prevent.

Source: sushindustries/sushindustries:packages/access/README.md (The two properties worth knowing)

### [HIGH] Importing a `.server` entry point from client-reachable code

Wrong:

```ts
// a route module, or anything a component can reach
import { verify } from "@sushindustries/access/tokens.server";
```

Correct: import `@sushindustries/access` for types and scope constants; call
`verify`, `mint` and `redeem` only from inside a server function handler or a
`.server.ts` helper.

TanStack Start's import protection denies the `.server.*` suffix from the
client bundle, so this fails the build. It is worth knowing anyway because a
route `loader` is isomorphic by default - the mistake gets made in code that
looks like ordinary route code, and the error surfaces away from the
assumption that caused it.

Source: sushindustries/sushindustries:packages/access/README.md (Entries)

### [MEDIUM] Expecting the package to know what a scope means, send the mail, or build the link

Wrong: looking for a scope registry with titles and descriptions, an
`invite({ ...,  sendTo })`, or a `redemptionUrl` option.

Correct: keep the vocabulary of scopes in the application, write the message
in the application's voice, and build the URL from the application's route.
`invite()` returns the secret and stops.

Scopes are stored, split on whitespace, and compared for equality. A package
that owned the meaning would be one you had to fork to add a permission, and
a package that owned the email would own the copy, the voice and the provider
along with it.

Source: sushindustries/sushindustries:packages/access/README.md (What it does not do)
