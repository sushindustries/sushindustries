import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildSchema, parse, validate } from "graphql";
import { describe, expect, test } from "vitest";

/*
 * Every named operation still matches the schema.
 *
 * `apollo/operations/` is not documentation - each file becomes one tool of
 * the Apollo MCP server, named after the operation inside it. So an operation
 * asking for a field that no longer exists is a tool that fails at call time,
 * in somebody else's client, with an error about a schema they cannot see.
 *
 * The schema is generated from the Drizzle tables, which means it moves
 * whenever a column does - and the operations are hand written, which means
 * they do not. That gap is exactly what this closes.
 *
 * It lives here rather than in `pnpm run doctor` because validating GraphQL
 * needs the `graphql` package, and the doctor is deliberately plain Node with
 * nothing between it and the filesystem - it has to run on a bare install with
 * no build. This app already depends on `graphql` for the server it serves.
 */

const APOLLO = join(import.meta.dirname, "../../../apollo");

const schema = buildSchema(
	readFileSync(join(APOLLO, "schema.graphql"), "utf8"),
);

const operations = readdirSync(join(APOLLO, "operations")).filter((file) =>
	file.endsWith(".graphql"),
);

describe("the named operations", () => {
	test("there are some, so an empty directory cannot pass", () => {
		expect(operations.length).toBeGreaterThan(5);
	});

	test.each(operations)("%s validates against the schema", (file) => {
		const source = readFileSync(join(APOLLO, "operations", file), "utf8");
		const errors = validate(schema, parse(source));

		expect(
			errors.map((error) => error.message),
			`${file} does not match the generated schema - regenerate with \`pnpm sushindustries graphql\`, or fix the operation`,
		).toStrictEqual([]);
	});

	test("each one carries a comment saying what it is for", () => {
		/*
		 * The comment above an operation becomes its tool description, which is
		 * the only thing a client sees before deciding to call it. An operation
		 * with no comment is a tool named `Totals` and nothing else.
		 */
		const silent = operations.filter(
			(file) =>
				!readFileSync(join(APOLLO, "operations", file), "utf8").startsWith("#"),
		);

		expect(silent).toStrictEqual([]);
	});
});
