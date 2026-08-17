import { defineConfig } from "tsdown";
import { library } from "../../tsdown.base.ts";

/**
 * Two entries, and the split is the safety property.
 *
 * `schema` is table definitions and types - importable anywhere, including a
 * component. `client.server` opens a connection and reads `DATABASE_URL`, so it
 * exists as its own entry to make importing it from the client a resolution
 * error rather than a leaked secret.
 *
 * Neither driver is bundled: Drizzle is reflected over at runtime and `postgres`
 * is a node module. Inlining either would mean a consumer ships a second copy of
 * a package they already depend on.
 */
export default defineConfig(
	library({
		/*
		 * `schema-org` is its own entry because the vocabulary is ninety
		 * kilobytes of generated data. A route wanting a row type must not pull
		 * it into a browser bundle, and a separate entry is what makes that a
		 * property of the build rather than of everyone's discipline.
		 */
		entry: ["./src/schema.ts", "./src/schema-org.ts", "./src/client.server.ts"],
		platform: "node",
		deps: {
			neverBundle: ["drizzle-orm", "postgres"],
		},
		exports: {
			/*
			 * `./client` is what the app imports, and has been since before the
			 * file was renamed to carry its own warning. Kept as an alias so the
			 * suffix stays a statement about the file rather than a rename every
			 * call site has to follow.
			 *
			 * Copied from the generated entry rather than written out. Written
			 * out, it claimed `.d.mts` types for both conditions, so `require`
			 * resolved CJS against ESM declarations - which is exactly the
			 * "false ESM" attw reports, and exactly the drift generating the
			 * map was meant to end.
			 */
			customExports(exports) {
				exports["./client"] = exports["./client.server"];
				return exports;
			},
		},
	}),
);
