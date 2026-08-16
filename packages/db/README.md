# @sushindustries/db

The schema and the client. Drizzle over Postgres, with the connection kept
server-side by construction.

## Install

```bash
pnpm add @sushindustries/db
```

## Two entry points, on purpose

```ts
// Safe anywhere. Table shapes and inferred types, no driver.
import { packageStats, type PackageStat } from "@sushindustries/db/schema";

// Server only. Reads DATABASE_URL and opens a connection.
import { getDb } from "@sushindustries/db/client";
```

The split is the whole design. `schema` carries types a form or a table needs,
so a component can import them without pulling a Postgres client into the
browser bundle. `client.server.ts` carries the connection, and its `.server.ts`
suffix is in TanStack Start's default client deny list — importing it from
client-reachable code is a build error, not a code review note.

## Migrations

```bash
export DATABASE_URL=postgres://...
pnpm db:generate   # write SQL from the schema
pnpm db:migrate    # apply it
pnpm db:studio     # browse it
```

## Why the connection is lazy

Railway injects `DATABASE_URL` at runtime, not at build time. A module-scope
connection would be constructed during the build with an undefined URL and take
down the whole deploy, instead of failing the one route that actually needs a
database.
