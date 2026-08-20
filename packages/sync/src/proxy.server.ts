import { ELECTRIC_PROTOCOL_QUERY_PARAMS } from "@electric-sql/client";

/*
 * The gate in front of Electric.
 *
 * Server-only, and the `.server.ts` suffix is what makes that a build error
 * rather than a convention: it reads the environment, and TanStack Start's
 * import protection denies the suffix from the client bundle.
 */

export interface ShapeProxyOptions {
	/** The table to stream. Never read from the request. */
	table: string;

	/**
	 * The filter, as a parameterised expression - `page = $1`, not a string
	 * with a value already in it.
	 *
	 * Parameterised because the values come from the query string, and a
	 * `where` built by concatenation is the same injection it has always been.
	 * Electric passes it to Postgres; there is no layer in between that would
	 * catch it.
	 */
	where?: string;

	/**
	 * The values for `where`, in order, derived from the request.
	 *
	 * A function rather than a value because the whole point is that they vary
	 * per request. Returning `null` refuses: the caller could not work out who
	 * or what is being asked about, so there is nothing to scope the shape to
	 * and the answer must not be "everything".
	 */
	params(request: Request): readonly string[] | null;

	/** Columns to send. Omitted means the table's own, which is usually right. */
	columns?: readonly string[];
}

export type ShapeProxy = (request: Request) => Promise<Response>;

/**
 * A handler that answers shape requests for exactly one shape.
 *
 * The three rules it exists to enforce, none of which is visible in a diff of
 * the route that would otherwise hand-roll them:
 *
 * **The shape is defined here.** `table`, `where` and `columns` are written by
 * the caller and never read from the query string, so `?table=api_tokens` is
 * not a shape request - it is an ignored parameter.
 *
 * **Only the protocol parameters pass through.** `offset`, `handle`, `live`
 * and the rest are how a stream resumes where it left off; they carry no
 * authority over what is in it. Forwarding the whole query string would hand
 * back the authority the previous rule just took away.
 *
 * **The encoding headers are dropped.** `fetch` decompresses the body and
 * leaves the headers saying it is still compressed, so forwarding them
 * unchanged tells the browser to decode something already decoded. It fails
 * mid-stream rather than at the request, which is the kind of bug that gets
 * blamed on the network.
 */
export function shapeProxy(options: ShapeProxyOptions): ShapeProxy {
	return async (request) => {
		/*
		 * Read per request, not at module scope. Railway injects variables at
		 * runtime, so a value captured at import time is captured during the
		 * build, when it is undefined.
		 */
		const electric = process.env.ELECTRIC_URL;

		if (!electric) {
			/*
			 * 503 rather than an empty shape. An empty shape is a truthful
			 * statement that there are no rows, and there may well be some - a
			 * reader would see a confident zero on a page that has data. This
			 * says the deployment cannot answer, which is what is true.
			 */
			return Response.json(
				{ error: "No live sync in this environment." },
				{ status: 503 },
			);
		}

		const bound = options.params(request);
		if (!bound) {
			return Response.json(
				{ error: "The shape was not scoped." },
				{ status: 400 },
			);
		}

		const asked = new URL(request.url);
		const origin = new URL("/v1/shape", electric);

		for (const [key, value] of asked.searchParams) {
			if (ELECTRIC_PROTOCOL_QUERY_PARAMS.includes(key)) {
				origin.searchParams.set(key, value);
			}
		}

		origin.searchParams.set("table", options.table);
		if (options.where) origin.searchParams.set("where", options.where);
		if (options.columns?.length) {
			origin.searchParams.set("columns", options.columns.join(","));
		}

		// Electric numbers them from one, not from zero.
		bound.forEach((value, index) => {
			origin.searchParams.set(`params[${index + 1}]`, value);
		});

		/*
		 * Electric Cloud identifies the database with these two; a self-hosted
		 * instance needs neither. Read here rather than baked into the URL so
		 * one implementation serves both, and so the secret is never a
		 * substring of something that might be logged as an origin.
		 */
		const source = process.env.ELECTRIC_SOURCE_ID;
		const secret = process.env.ELECTRIC_SOURCE_SECRET;
		if (source) origin.searchParams.set("source_id", source);
		if (secret) origin.searchParams.set("secret", secret);

		const answered = await fetch(origin);

		const headers = new Headers(answered.headers);
		headers.delete("content-encoding");
		headers.delete("content-length");

		return new Response(answered.body, {
			status: answered.status,
			statusText: answered.statusText,
			headers,
		});
	};
}
