import { createHash } from "node:crypto";
import { getDb } from "@sushindustries/db/client";
import {
	and,
	asc,
	desc,
	documents,
	eq,
	referencePages,
	referenceProviders,
	sql,
} from "@sushindustries/db/schema";
import sdl from "../../../../../apollo/schema.graphql?raw";
import { githubResolvers } from "./github.server";

/*
 * The graph, over the projection.
 *
 * Resolvers and nothing else: the schema is `apollo/schema.graphql`, read from
 * disk rather than written twice in a template literal here. One file is the
 * contract, and it is the one Apollo's tooling, the MCP server and this
 * process all read - so there is no version of "the schema" that only one of
 * them has seen.
 *
 * Read-only. Every field's source is a file in git and the way to change one
 * is to change the file, so a mutation here would be a second way to write
 * that the next `sync` would silently discard.
 *
 * `.server.ts` because it opens a database connection. Named for the protocol
 * it speaks, not for the word "graph" - `graph.server.ts` beside it is the
 * JSON-LD entity graph and has nothing to do with this.
 */

/*
 * The connection, per call rather than at module load.
 *
 * `getDb` builds it the first time and remembers it. Calling it inside each
 * resolver rather than destructuring `db` at the top is what keeps a build
 * with no DATABASE_URL from failing at import time: the route is prerendered,
 * the module is loaded, and nothing has asked for a connection yet.
 */
const db = () => getDb();

/**
 * The SDL, inlined at build time from the file Apollo also reads.
 *
 * `?raw` rather than a filesystem read, which is what the assistant's persona
 * and every Markdown page here already do. Reading it at runtime looked
 * simpler and was wrong twice over: the working directory during a build is
 * the app, not the repository, and a schema that has to exist on disk beside
 * the server is a schema the runtime image would have to carry.
 *
 * Inlined, there is still one file. Apollo's tooling, its MCP server and this
 * process all read `apollo/schema.graphql`; this one just reads it earlier.
 */
export function typeDefs(): string {
	return sdl;
}

/** `COMPONENT` on the wire, `component` in the column. */
const toKind = (value?: string | null) =>
	value ? value.toLowerCase() : undefined;
const fromKind = (value: string) => value.toUpperCase();

const shape = (row: typeof documents.$inferSelect) => ({
	...row,
	kind: fromKind(row.kind),
	syncedAt: row.syncedAt.toISOString(),
});

/** A LIKE pattern that treats the caller's text as text, not as syntax. */
const contains = (value: string) =>
	`%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

/**
 * Skills, as a view over the documents whose kind is `skill`.
 *
 * Ordered by path and numbered from one on the way out, so the index is a
 * property of the list rather than something stored - which is what keeps it
 * from becoming a second identity that has to be maintained. Its own function
 * so `skill(index:)` reads the same list `skills` returns, rather than a
 * second query that could order differently.
 */
async function listSkills() {
	const rows = await db()
		.select()
		.from(documents)
		.where(eq(documents.kind, "skill"))
		.orderBy(asc(documents.path));

	return rows.map((row: typeof documents.$inferSelect, at: number) => ({
		index: at + 1,
		name: row.title ?? row.slug ?? row.path,
		description: row.summary,
		path: row.path,
		tokens: row.tokens,
		body: row.body,
	}));
}

/**
 * The shape contract, moved by hand.
 *
 * Separate from `revision` because they answer different questions: this one
 * changes when a field changes meaning, which is a client's problem, and the
 * revision changes when a file does, which is a cache's. Bumping this on every
 * edit would make it useless for the thing it is for.
 */
const API_VERSION = "1.0.0";

export const resolvers = {
	Query: {
		/*
		 * A hash over every document's hash, ordered by path.
		 *
		 * Ordering matters: the same set of files has to produce the same value
		 * whatever order Postgres returns them in, or the revision would change
		 * on its own and every cache would miss forever.
		 */
		async apiVersion() {
			const rows = await db()
				.select({ sha: documents.sha, syncedAt: documents.syncedAt })
				.from(documents)
				.orderBy(asc(documents.path));

			const digest = createHash("sha256");
			for (const row of rows) digest.update(row.sha);

			const newest = rows.reduce<Date | null>(
				(latest, row) =>
					!latest || row.syncedAt > latest ? row.syncedAt : latest,
				null,
			);

			return {
				version: API_VERSION,
				revision: digest.digest("hex").slice(0, 16),
				syncedAt: newest?.toISOString() ?? null,
				documents: rows.length,
			};
		},

		/*
		 * The inverse of a cache check: hand over what you have, get back what
		 * you do not. Doing it this way round rather than "give me everything
		 * since a timestamp" means a client that missed a sync entirely still
		 * gets a correct answer, because the comparison is on content rather
		 * than on time.
		 */
		async changedSince(_: unknown, args: { shas: string[] }) {
			const held = new Set(args.shas);
			const rows = await db()
				.select()
				.from(documents)
				.orderBy(asc(documents.path));

			return rows
				.filter((row: typeof documents.$inferSelect) => !held.has(row.sha))
				.map(shape);
		},

		...githubResolvers.Query,
		async totals() {
			const [row] = await db().execute<{
				documents: number;
				reference_pages: number;
				providers: number;
				synced_at: Date | null;
			}>(sql`
				select
					(select count(*)::int from ${documents}) as documents,
					(select count(*)::int from ${referencePages}) as reference_pages,
					(select count(*)::int from ${referenceProviders}) as providers,
					(select max(synced_at) from ${documents}) as synced_at
			`);

			return {
				documents: row?.documents ?? 0,
				referencePages: row?.reference_pages ?? 0,
				providers: row?.providers ?? 0,
				syncedAt: row?.synced_at ? new Date(row.synced_at).toISOString() : null,
			};
		},

		async documents(
			_: unknown,
			args: {
				kind?: string;
				slug?: string;
				section?: string;
				limit?: number;
				offset?: number;
			},
		) {
			const where = [
				args.kind ? eq(documents.kind, toKind(args.kind) as never) : undefined,
				args.slug ? eq(documents.slug, args.slug) : undefined,
				args.section ? eq(documents.section, args.section) : undefined,
			].filter(Boolean);

			const rows = await db()
				.select()
				.from(documents)
				.where(where.length ? and(...where) : undefined)
				.orderBy(asc(documents.path))
				.limit(Math.min(args.limit ?? 25, 200))
				.offset(args.offset ?? 0);

			return rows.map(shape);
		},

		async document(
			_: unknown,
			args: { path?: string; slug?: string; section?: string },
		) {
			if (args.path) {
				const [row] = await db()
					.select()
					.from(documents)
					.where(eq(documents.path, args.path))
					.limit(1);
				return row ? shape(row) : null;
			}

			if (!args.slug) return null;

			/*
			 * A slug with no section means the overview. `index` first, then
			 * whatever single document the slug has - a package README has no
			 * sections at all and should still answer.
			 */
			const where = args.section
				? and(
						eq(documents.slug, args.slug),
						eq(documents.section, args.section),
					)
				: eq(documents.slug, args.slug);

			const rows = await db()
				.select()
				.from(documents)
				.where(where)
				.orderBy(asc(documents.section));

			const found =
				rows.find(
					(row: typeof documents.$inferSelect) =>
						row.section === (args.section ?? "index"),
				) ?? rows[0];

			return found ? shape(found) : null;
		},

		async search(
			_: unknown,
			args: { query: string; kind?: string; limit?: number },
		) {
			const pattern = contains(args.query);
			const where = [
				sql`(${documents.title} ilike ${pattern} or ${documents.summary} ilike ${pattern} or ${documents.body} ilike ${pattern})`,
				args.kind ? eq(documents.kind, toKind(args.kind) as never) : undefined,
			].filter(Boolean);

			const rows = await db()
				.select()
				.from(documents)
				.where(and(...where))
				// Smallest first: a match in a two-hundred-token API section is a
				// better answer than the same match somewhere in a source file.
				.orderBy(asc(documents.tokens))
				.limit(Math.min(args.limit ?? 20, 100));

			const needle = args.query.toLowerCase();
			return rows.map((row: typeof documents.$inferSelect) => ({
				document: shape(row),
				excerpt:
					row.body
						.split("\n")
						.find((line: string) => line.toLowerCase().includes(needle))
						?.trim()
						.slice(0, 200) ?? "",
			}));
		},

		/*
		 * Skills, as a view over the documents whose kind is `skill`.
		 *
		 * Ordered by name and numbered from one on the way out, so the index is a
		 * property of the list rather than something stored - which is what keeps
		 * it from being a second identity that has to be maintained.
		 */
		skills: listSkills,

		async skill(_: unknown, args: { name?: string; index?: number }) {
			const all = await listSkills();
			if (args.name) {
				return (
					all.find((one) => one.name === args.name) ??
					all.find((one) => one.path.includes(args.name as string)) ??
					null
				);
			}
			return args.index ? (all[args.index - 1] ?? null) : null;
		},

		async providers() {
			return db()
				.select()
				.from(referenceProviders)
				.orderBy(desc(referenceProviders.entries));
		},
		async findReference(
			_: unknown,
			args: {
				query: string;
				provider?: string;
				section?: string;
				limit?: number;
			},
		) {
			const pattern = contains(args.query);
			const where = [
				sql`(${referencePages.name} ilike ${pattern} or ${referencePages.description} ilike ${pattern} or ${referencePages.section} ilike ${pattern})`,
				args.provider ? eq(referencePages.provider, args.provider) : undefined,
				args.section ? eq(referencePages.section, args.section) : undefined,
			].filter(Boolean);

			return db()
				.select()
				.from(referencePages)
				.where(and(...where))
				.orderBy(asc(referencePages.name))
				.limit(Math.min(args.limit ?? 20, 100));
		},
	},

	Repository: githubResolvers.Repository,

	ReferenceProvider: {
		async pages(
			parent: { provider: string },
			args: { section?: string; limit?: number },
		) {
			const where = [
				eq(referencePages.provider, parent.provider),
				args.section ? eq(referencePages.section, args.section) : undefined,
			].filter(Boolean);

			return db()
				.select()
				.from(referencePages)
				.where(and(...where))
				.orderBy(asc(referencePages.name))
				.limit(Math.min(args.limit ?? 25, 200));
		},
	},
};
