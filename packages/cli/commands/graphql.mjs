/*
 * The GraphQL schema, generated from the Drizzle tables it reads.
 *
 * Written rather than hand-maintained because the two would drift the first
 * time a column was added: a field that no longer matches its column is a
 * resolver that returns undefined and a client that cannot tell why. Drizzle
 * already knows every column and its type, so it is the only thing that should
 * be describing them.
 *
 * What is generated is the type per table and the enum. What stays hand
 * written is `apollo/queries.graphql` - the Query type - because a query is a
 * decision about what is worth asking, and no table knows that. Generating
 * one entry point per column produces a graph nobody can navigate.
 *
 * The output is checked in and CI diffs it, the same rule the exports maps
 * follow: if a build rewrites it, commit the rewrite.
 */

import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "../lib/context.mjs";
import { banner, blank, fail, field, note, ok } from "../lib/ui.mjs";

const OUT = join(root, "apollo/schema.graphql");

/** The codegen config, if this checkout has one. */
const CODEGEN = join(root, "codegen.ts");

/**
 * The resolver types, from the schema written a moment ago.
 *
 * Here rather than in a script of its own, because the two outputs are one
 * fact stated twice: the schema says what the field is, the generated
 * `Resolvers` says what a function answering it must return. Generating them
 * apart means a run of one and not the other, which is the drift this whole
 * chain exists to remove.
 *
 * A missing `codegen.ts` means a consumer is running the published CLI against
 * their own checkout, where there are no resolvers to type - that is a skip.
 * A config that is present and will not run is a failure, said out loud:
 * a generation step that quietly does nothing is worse than one that stops,
 * because the stale output stays on disk looking generated.
 */
function types() {
	if (!existsSync(CODEGEN)) {
		note("No codegen.ts here, so no resolver types to write.");
		return true;
	}

	const run = spawnSync(
		"pnpm",
		["exec", "graphql-codegen", "--config", "codegen.ts"],
		{ cwd: root, stdio: "pipe", encoding: "utf8" },
	);

	if (run.status === 0) return true;

	blank();
	fail("graphql-codegen did not run, so the resolver types are now stale.");
	note(
		(run.stderr || run.stdout || String(run.error)).trim().split("\n").at(-1) ??
			"",
	);
	return false;
}

/** Postgres column types, as the GraphQL scalar each one becomes. */
const SCALARS = {
	PgText: "String",
	PgVarchar: "String",
	PgInteger: "Int",
	PgSerial: "Int",
	PgBigInt53: "Int",
	PgBoolean: "Boolean",
	PgDoublePrecision: "Float",
	PgReal: "Float",
	PgUUID: "ID",
	/*
	 * Timestamps leave as strings, not as a Date scalar. A custom scalar would
	 * have to be declared, resolved and understood by every client for the sake
	 * of a value that is already an ISO string by the time it is serialised.
	 */
	PgTimestamp: "String",
	PgTimestampString: "String",
};

/**
 * One table, as a GraphQL type.
 *
 * The column's own `notNull` decides the `!`, so a nullable column cannot be
 * described as required - which is the drift that turns into a client crash
 * rather than a type error.
 */
function typeFor(
	name,
	table,
	columns,
	{ describe = {}, extra = [], as = {} } = {},
) {
	const lines = [`type ${name} {`];

	// Drizzle's own accessor, not Object.entries: a table object also carries
	// methods and symbols, and `enableRLS` is not a column however much it
	// looks like one from outside.
	for (const [field, column] of Object.entries(columns(table))) {
		/*
		 * An override wins over the column type, and there is exactly one:
		 * `kind` is a text column that only ever holds one of eight words, and
		 * describing it as String on the wire throws away the one piece of
		 * validation a client could have had for free.
		 */
		const scalar = as[field] ?? SCALARS[column.constructor.name];
		if (!scalar) {
			throw new Error(
				`No GraphQL scalar for ${column.constructor.name} (${name}.${field}). Add it to SCALARS.`,
			);
		}

		if (describe[field]) lines.push(`\t"${describe[field]}"`);
		lines.push(`\t${field}: ${scalar}${column.notNull ? "!" : ""}`);
	}

	for (const line of extra) lines.push(`\t${line}`);
	lines.push("}");
	return lines.join("\n");
}

export async function graphql() {
	banner("graphql");

	const schema = await import("@sushindustries/db/schema");
	const { documents, referencePages, referenceProviders, GRAPHQL_EXPOSURE } =
		schema;
	const { getTableColumns, getTableName, is } = await import("drizzle-orm");
	const { PgTable } = await import("drizzle-orm/pg-core");

	/*
	 * Every table has to have been classified, and this refuses to run until it
	 * is. The columns below have always come from Drizzle, so a field could
	 * never disagree with its column - but *which* tables was three names
	 * destructured by hand, so adding a table to the schema did nothing here at
	 * all. Three tables holding credentials were added and the graph did not
	 * notice, which is the good outcome of a bad mechanism: safe by accident.
	 *
	 * `GRAPHQL_EXPOSURE` in the schema is where the decision is written down,
	 * and this is what makes writing it down compulsory. A new table now fails
	 * this command with its own name in the message, which is a minute of
	 * annoyance in exchange for the two silent failures it removes: a private
	 * table quietly published, and a public one quietly missing.
	 */
	const tables = Object.values(schema)
		.filter((value) => is(value, PgTable))
		.map(getTableName)
		.sort();

	const unclassified = tables.filter((name) => !GRAPHQL_EXPOSURE[name]);

	if (unclassified.length > 0) {
		throw new Error(
			`These tables are not classified in GRAPHQL_EXPOSURE: ${unclassified.join(", ")}.\n` +
				"Add each to packages/db/src/schema.ts as `public` or `private`, with the reason.\n" +
				"Nothing is exposed by default - a table has to be decided about before this can run.",
		);
	}

	const stale = Object.keys(GRAPHQL_EXPOSURE).filter(
		(name) => !tables.includes(name),
	);

	if (stale.length > 0) {
		throw new Error(
			`GRAPHQL_EXPOSURE names tables that no longer exist: ${stale.join(", ")}.\n` +
				"Remove them from packages/db/src/schema.ts - a classification for a dropped table is a rule about nothing.",
		);
	}

	const published = tables.filter(
		(name) => GRAPHQL_EXPOSURE[name] === "public",
	);

	/*
	 * The Query type and the doc comments live in their own file, hand written.
	 * Read here and appended, so one file leaves this command and Apollo's
	 * tooling, the MCP server and the running route all read the same SDL.
	 */
	const { readFileSync } = await import("node:fs");
	const queries = readFileSync(join(root, "apollo/queries.graphql"), "utf8");

	const kinds = [
		"component",
		"package",
		"post",
		"page",
		"desk",
		"skill",
		"note",
		"collection",
		"task",
		"graph",
		"insight",
		"template",
		"config",
		"plugin",
		"repo",
		"source",
	];

	const sdl = [
		"# Generated by `pnpm sushindustries graphql`. Do not edit the types.",
		"#",
		"# The types below are written from the Drizzle tables, so a column and its",
		"# field cannot disagree. The Query type in apollo/queries.graphql is hand",
		"# written, because what is worth asking is not something a table knows.",
		"",
		'"Which catalogue a document came from. SOURCE is code, not prose."',
		"enum DocumentKind {",
		...kinds.map((kind) => `\t${kind.toUpperCase()}`),
		"}",
		"",
		'"One file in this repository: what it is, what it costs to read, and its text."',
		typeFor("Document", documents, getTableColumns, {
			as: { kind: "DocumentKind" },
			describe: {
				path: "Repo-relative path. The identity of the row.",
				slug: "The thing this belongs to: `card`, `http`, `adding-things`.",
				section:
					"For component pages: index, get-started, guides, api or examples.",
				route: "Where the site serves this, if it does. Null for source files.",
				body: "The text. Check `tokens` before asking for it across a list.",
				tokens:
					"Estimated at four characters a token. Enough to decide before spending them.",
				sha: "SHA-256 of the body, so a reader can tell whether its copy is current.",
				syncedAt:
					"When `sync` last wrote this row. The projection's age, stated.",
			},
		}),
		"",
		'"A dependency whose published documentation index is mirrored here."',
		typeFor("ReferenceProvider", referenceProviders, getTableColumns, {
			describe: {
				provider: "Hostname, dashed. `orm-drizzle-team`.",
				source: "The llms.txt this was cut from.",
				parent: "Set when another provider's index listed this one.",
				usedFor:
					"Why this dependency, in this repo. The sentence a lockfile never records.",
			},
			extra: [
				'"This provider\'s pages, optionally narrowed to one section."',
				"pages(section: String, limit: Int = 25): [ReferencePage!]!",
			],
		}),
		"",
		'"""',
		"One page in somebody else's documentation.",
		"",
		"A citation, not a copy. There is no `body` field and there must not be",
		"one: what is kept is enough to know which page answers a question, and",
		"the prose stays on the server that wrote it.",
		'"""',
		typeFor("ReferencePage", referencePages, getTableColumns),
		"",
		queries.trim(),
		"",
	].join("\n");

	writeFileSync(OUT, sdl);

	field("tables", published.join(", "));
	field("written", "apollo/schema.graphql");

	if (!types()) {
		blank();
		process.exitCode = 1;
		return;
	}

	field("typed", "apps/web/src/modules/content/graphql.generated.ts");
	blank();
	note("The Query type is hand written in apollo/queries.graphql and appended");
	note("here, so one file is the contract everything reads.");
	blank();
	ok("Schema and resolver types generated");
	blank();
}
