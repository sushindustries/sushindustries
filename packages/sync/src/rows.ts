import type { ExternalParamsRecord, Row } from "@electric-sql/client";
import type { ElectricCollectionConfig } from "@tanstack/electric-db-collection";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { createCollection } from "@tanstack/react-db";

/*
 * The reading half: a collection of rows that arrive as they are written.
 *
 * Client-safe, and no `.server` suffix, because it holds a URL and nothing
 * else. The URL is this application's own proxy - never Electric - which is
 * the whole arrangement `shapeProxy` exists for.
 */

export interface SyncedRowsOptions<T extends Row<unknown>> {
	/** This app's proxy path, e.g. `/api/feedback/shape`. Not Electric's. */
	url: string;

	/**
	 * What narrows the shape, appended to the proxy's URL.
	 *
	 * These reach `ShapeProxyOptions.params` on the other side, where they
	 * become bound parameters. They do not name a table or a filter, and the
	 * proxy would ignore them if they tried.
	 *
	 * `ExternalParamsRecord` rather than a plain record, because it reserves
	 * the protocol keys - `offset`, `handle`, `live` and the rest - as never.
	 * That is the client-side twin of the allowlist in `shapeProxy`: one stops
	 * a caller sending a protocol key as scope, the other stops a caller
	 * sending scope as a shape definition, and both mistakes look harmless.
	 */
	scope?: ExternalParamsRecord;

	/** Stable identity for a row. Usually its primary key. */
	getKey(row: T): string | number;

	/**
	 * Writes one row and reports the Postgres transaction that wrote it.
	 *
	 * The transaction id is the contract, not an extra. The row is about to
	 * arrive back over the stream, so the collection has to recognise its own
	 * write returning to it - and before the server has said anything else,
	 * the transaction is the only thing that identifies it. Without one, the
	 * optimistic row is dropped the moment the write resolves and reappears a
	 * beat later when the stream catches up, which reads on screen as the
	 * change flickering off and on.
	 *
	 * `null` means there was no transaction to wait for - no database in this
	 * environment, say. Returning it is how a caller says "do not block",
	 * which is different from blocking forever on a write that never happened.
	 */
	write(rows: readonly T[]): Promise<number | null>;

	/** Distinguishes two collections over the same table. */
	id?: string;
}

/**
 * Rows from one shape, live, writing through an ordinary endpoint.
 *
 * The split is Electric's design rather than a limitation worked around: sync
 * is read-only, so a write goes to whatever endpoint already validates it,
 * and only the result comes back over the stream. That is why `write` takes a
 * function instead of this package owning a POST - what a write means, and
 * what refuses it, is the application's.
 */
export function syncedRows<T extends Row<unknown>>(
	options: SyncedRowsOptions<T>,
) {
	/*
	 * Typed as the library's own config rather than inferred from the object
	 * literal. Inference resolves `onInsert`'s parameter before it has settled
	 * `T`, so the mutations arrive as a bare record and every field read off
	 * one is `unknown` - which typechecks, and quietly throws the caller's
	 * type away at the one place it was supposed to be carried.
	 */
	const config: ElectricCollectionConfig<T> = {
		id: options.id,
		shapeOptions: {
			url: options.url,
			params: options.scope,
		},
		getKey: options.getKey,
		onInsert: async ({ transaction }) => {
			const rows = transaction.mutations.map((mutation) => mutation.modified);

			/*
			 * `?? 0` rather than leaving it undefined: the matching contract
			 * takes a number, and a collection told to wait for nothing waits
			 * for nothing rather than forever.
			 */
			return { txid: (await options.write(rows)) ?? 0 };
		},
	};

	return createCollection(electricCollectionOptions(config));
}
