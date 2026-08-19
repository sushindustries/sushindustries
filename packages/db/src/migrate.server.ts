import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/*
 * Apply every migration that has not been applied, then exit.
 *
 * This exists because a schema change and the code that reads it ship in the
 * same commit, and only one of them was arriving. Railway builds the image and
 * starts the server; nothing in that sequence ran a migration, so the committed
 * SQL was applied by whoever remembered to run it by hand - which is a schema
 * that drifts from its code by exactly as much as people forget.
 *
 * Written as its own bundle rather than as a step inside the server, because
 * Railway's pre-deploy command runs in a separate container between the build
 * and the deploy: it has the environment and the private network, it does not
 * have the running app, and **if it fails the deployment does not proceed.**
 * That last part is the whole point. A migration that fails should stop the
 * release that depends on it, not surface later as a query against a column
 * that is not there.
 *
 * Running it at server startup would have been the other option Drizzle
 * documents, and it is worse here: every replica would race the same DDL on
 * every boot, and a failed migration would leave a server running against a
 * schema it cannot use rather than stopping the deploy.
 *
 * Its dependencies are bundled, not external - the runtime image carries the
 * Nitro output and nothing else, so `node_modules` is not there to resolve.
 */

const url = process.env.DATABASE_URL;

if (!url) {
	/*
	 * Not an error. This site renders every page from Markdown inlined at
	 * build time, so a deployment without a database is a supported
	 * deployment - the counters are simply absent. Failing here would make
	 * the database mandatory by accident.
	 */
	console.log("DATABASE_URL unset - no database to migrate.");
	process.exit(0);
}

/*
 * `max: 1` because a migration is a sequence, not a workload: one connection
 * runs the statements in order and drizzle's own lock keeps a second deploy
 * from starting halfway through this one.
 */
const sql = postgres(url, { max: 1 });

try {
	await migrate(drizzle(sql), {
		migrationsFolder: process.env.MIGRATIONS_FOLDER ?? "./drizzle",
	});
	console.log("migrations applied.");
} catch (error) {
	console.error("migration failed:", error);
	process.exitCode = 1;
} finally {
	await sql.end();
}
