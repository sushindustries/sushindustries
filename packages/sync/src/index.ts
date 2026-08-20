/*
 * Live rows from Postgres, and the gate in front of them.
 *
 * Electric serves a *shape* over HTTP - a table, a filter, some columns - and
 * has no opinion about who may read one. The shape is the query, so a client
 * that can name the table can read the table, and every other table the same
 * Electric instance can see. That is not a flaw; it is the reason the
 * documented deployment puts an application in front of it.
 *
 * This package is that application's half, in two pieces that only make sense
 * together:
 *
 *   - `shapeProxy` defines the shape on the server and forwards the stream
 *   - `syncedRows` builds the collection that reads it
 *
 * Both are here rather than in the app because the mistakes are not
 * application-specific. Forwarding `table` from the query string, or passing
 * `content-encoding` back through `fetch`, are wrong in the same way in every
 * app that writes them, and neither fails at the request - the first fails as
 * a data leak nobody sees, and the second as a decoding error halfway through
 * a stream.
 */

export type { ShapeProxy, ShapeProxyOptions } from "./proxy.server";
export { shapeProxy } from "./proxy.server";
export type { SyncedRowsOptions } from "./rows";
export { syncedRows } from "./rows";
