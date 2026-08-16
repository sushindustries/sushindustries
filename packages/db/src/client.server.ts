import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/*
 * The database client. Server-only, twice over: the `.server.ts` suffix is in
 * TanStack Start's default client deny list, and this file is the only place
 * that reads DATABASE_URL.
 *
 * The connection is created lazily rather than at module scope. Railway
 * injects DATABASE_URL at runtime, not at build time, so a module-scope
 * connection would be constructed during the build with an undefined URL and
 * fail the whole deploy rather than the one route that needs a database.
 */

let client: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
	if (client) return client;

	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error(
			"DATABASE_URL is not set. Add a Postgres service in Railway, or set it in .env for local development.",
		);
	}

	client = drizzle(postgres(url, { prepare: false }), { schema });
	return client;
}
