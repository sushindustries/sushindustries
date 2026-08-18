---
name: core
description: >
  How @sushindustries/db splits into a client-safe schema entry point and a
  server-only, lazily-connected client entry point, and why the connection
  must never be built at module scope. Load when importing from
  @sushindustries/db, writing a loader or server function that touches the
  database, or running migrations.
metadata:
  type: core
  library: '@sushindustries/db'
  library_version: '0.1.0'
sources:
  - 'sushindustries/sushindustries:packages/db/README.md'
---

## Setup

```ts
// Safe anywhere - table shapes and inferred types, no driver.
import { packageStats, type PackageStat } from "@sushindustries/db/schema";

// Server only - reads DATABASE_URL and opens a connection.
import { getDb } from "@sushindustries/db/client";
```

## Core Patterns

### Two entry points, and the split is the whole design

`schema` carries types a form or a table needs, so client-reachable code can
import them without pulling a Postgres driver into the browser bundle.
`client` carries the connection and is server-only by its `.server.ts`
suffix.

### The connection is built lazily, inside a function

```ts
export function getDb() {
	// constructs and returns the client here, not at module scope
}
```

Called once per request that actually needs it, never at import time.

### Migrations run from a developer machine, never the deployed app

```bash
export DATABASE_URL=postgres://...
pnpm db:generate   # write SQL from the schema
pnpm db:migrate    # apply it
pnpm db:studio     # browse it
```

## Common Mistakes

### [CRITICAL] Importing the client entry point from client-reachable code

Wrong:

```ts
// a route component or a loader that also runs in the browser
import { getDb } from "@sushindustries/db/client";
```

Correct: import only `@sushindustries/db/schema` in code that can run on the
client; call `getDb()` only from inside a `.server.ts` helper or a server
function handler.

TanStack Start's default import protection denies the `.server.*` suffix
from the client bundle, so this fails the build - but a route `loader` is
isomorphic by default, meaning the mistake is often made somewhere that
looks like ordinary route code, and the build error surfaces far from where
the assumption was actually made.

Source: sushindustries/sushindustries:packages/db/README.md (Two entry points, on purpose)

### [HIGH] Constructing the database client at module scope

Wrong:

```ts
const db = drizzle(process.env.DATABASE_URL!);

export function getRows() {
	return db.select().from(packageStats);
}
```

Correct: build the client inside a function, called per request:

```ts
export function getDb() {
	return drizzle(process.env.DATABASE_URL!);
}
```

Railway injects `DATABASE_URL` at runtime, not at build time. A module-scope
connection is constructed during the build with an undefined URL and takes
down the whole deploy - a lazy one fails only the one route that actually
needed a database.

Source: sushindustries/sushindustries:packages/db/README.md (Why the connection is lazy)

### [MEDIUM] Running migrations as part of the app's deploy/start command

Wrong: adding `pnpm db:migrate` to the runtime container's start script.

Correct: run migrations from a developer machine against the database
service's TCP proxy, before or after a deploy, never as part of it.

The runtime image ships only the compiled server - a deploy that can rewrite
the schema is a deploy that can fail halfway through doing it, with the app
already partway restarted on the new code.

Source: sushindustries/sushindustries:packages/db/README.md (Where the database lives)
