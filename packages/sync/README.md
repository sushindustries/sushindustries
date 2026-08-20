# @sushindustries/sync

Live Postgres rows in the browser, over [Electric](https://electric.ax), with
the gate that makes serving them safe.

## Install

```bash
pnpm add @sushindustries/sync
```

## Use

Two halves, and they only make sense together. On the server, define the shape:

```ts
import { shapeProxy } from "@sushindustries/sync/proxy.server";

const votes = shapeProxy({
  table: "page_feedback",
  where: "page = $1",
  params: (request) => {
    const page = new URL(request.url).searchParams.get("page");
    return page ? [page] : null;
  },
});
```

On the client, read it:

```ts
import { syncedRows } from "@sushindustries/sync";

const collection = syncedRows<Vote>({
  url: "/api/feedback/shape",   // your proxy, never Electric
  scope: { page },
  getKey: (row) => row.id,
  write: async (rows) => {
    const response = await fetch("/api/feedback", { method: "POST", /* … */ });
    const { txid } = await response.json();
    return txid;
  },
});
```

## Why it exists

**Electric has no opinion about who may read a shape.** A shape *is* a query -
a table, a filter, some columns - so a client that can name the table can read
the table, and every other table the same Electric instance can see. That is
not a flaw. It is why the documented deployment puts an application in front
of it, and this package is that application's half.

Three things go wrong when the proxy is written by hand each time, and none of
them fails at the request:

**Forwarding the query string.** If `table` or `where` can arrive from the
caller, `?table=api_tokens` is a valid shape request. `shapeProxy` sets them
itself and passes through only Electric's protocol parameters - `offset`,
`handle`, `live` and the rest - which say where a stream resumes and carry no
authority over what is in it.

**Building `where` by concatenation.** The values come from the query string
and reach Postgres with nothing in between. So `where` is parameterised -
`page = $1` - and the values arrive from a function, separately.

**Passing the response headers straight back.** `fetch` decompresses the body
and leaves `content-encoding` saying it did not, so the browser is told to
decode something already decoded. It fails halfway through a stream rather
than at the request, which is the kind of bug that gets blamed on the network.

## The `txid` contract

Sync is read-only. A write goes to whatever endpoint already validates it, and
only the result comes back over the stream - which means a client that has
just written a row is racing its own write back to itself.

`write` therefore returns the Postgres transaction id, and the collection
holds the optimistic row until the stream catches up to it. Without one, the
optimistic row is dropped the moment the write resolves and reappears a beat
later when the row arrives, which reads on screen as the change flickering off
and on.

Getting it requires reading `pg_current_xact_id()` **inside the same
transaction as the insert**. Read outside it, the number belongs to a
different transaction and matches nothing:

```ts
return db.transaction(async (tx) => {
  await tx.insert(table).values(row);
  const [{ txid }] = await tx.execute(sql`select pg_current_xact_id()::text as txid`);
  return { txid: Number(txid) };
});
```

Return `null` from `write` when there was no transaction - no database in that
environment, say. That is different from blocking forever on a write that
never happened.

## Requires

An Electric instance, named by `ELECTRIC_URL`. Unset, `shapeProxy` answers 503
rather than an empty shape: no rows and "cannot answer" are different
statements, and a reader should not see a confident zero on a page with data.

Electric replicates off the logical WAL, so the database needs
`wal_level = logical`. On a stock Postgres image that is `replica`, and
changing it needs a restart:

```sql
alter system set wal_level = 'logical';
-- then restart the server, not just reload
```

Electric Cloud additionally takes `ELECTRIC_SOURCE_ID` and
`ELECTRIC_SOURCE_SECRET`; self-hosted needs neither, and the proxy sends them
only when they are set.
