import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { SchemaTypeName } from "./schema-org.generated";

/*
 * The schema is client-safe on purpose.
 *
 * It carries table shapes and column types and nothing else - no connection
 * string, no driver. That is what lets a route import the inferred types for a
 * form or a table without dragging a Postgres client into the browser bundle.
 * The client lives in `client.server.ts`, which cannot be imported from the
 * client at all.
 */

/** Which catalogue a counted page came from. */
export type PageKind = "component" | "package" | "post" | "page";

/*
 * One row per page anybody has actually opened.
 *
 * What exists is not stored here, and must not be. Every component, package,
 * post and page is a file in this repo, globbed at build time, so a table
 * listing them would be a second list to keep in step with the first - the
 * exact thing the catalogues exist to avoid.
 *
 * What a build cannot know is what happened afterwards. That is this table,
 * and it answers the two questions worth asking about anything published:
 *
 *   was it added?   `firstSeen` - the first time anyone asked for the path
 *   is it used?     `views` and `lastSeen` - and no row at all means never
 *
 * Keyed by path rather than by slug, because a slug is only unique inside its
 * own catalogue: `/components/archive` and `/posts/archive` are two pages and
 * one slug. The path is what a visitor asked for and what a page already
 * knows about itself, so nothing has to be told which kind it is twice.
 *
 * This replaced `package_stats`, which counted one catalogue out of four. The
 * other three had no answer to "does anyone open this", which for a component
 * library is the question.
 */
export const pageViews = pgTable("page_views", {
	/** Route path, e.g. `/components/button`. The join key to the catalogue. */
	path: text("path").primaryKey(),

	/** Kept beside the path so counting one catalogue needs no path parsing. */
	kind: text("kind").$type<PageKind>().notNull(),

	views: integer("views").notNull().default(0),

	firstSeen: timestamp("first_seen", { withTimezone: true })
		.notNull()
		.defaultNow(),

	/** Most recent view, so a page that stopped being read is visible as one. */
	lastSeen: timestamp("last_seen", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;

/*
 * One row per vote on a documentation page.
 *
 * Raw events rather than counters, on purpose: a counter answers exactly one
 * question and destroys the data that would have answered the next. Rows can
 * be counted, windowed by day, or joined against a page rename - a pair of
 * integers can only ever go up.
 */
export const pageFeedback = pgTable("page_feedback", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

	/** Route path of the page judged, e.g. `/components/code-block`. */
	page: text("page").notNull(),

	/** `up` or `down`. Text rather than an enum: a migration per emotion is too many. */
	vote: text("vote").notNull(),

	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type PageFeedback = typeof pageFeedback.$inferSelect;
export type NewPageFeedback = typeof pageFeedback.$inferInsert;

/*
 * ── the index, as rows ───────────────────────────────────────────────────
 *
 * Three tables that are projections, not sources.
 *
 * The rule above still holds: what exists is a file in this repo, and a table
 * listing files would be a second list to keep in step. These are not that.
 * They are built by `pnpm sushindustries sync`, which drops and rewrites them
 * from the repository and the fetched shards, so they cannot disagree with
 * their source - they can only be older than it, which `syncedAt` says out
 * loud.
 *
 * They exist because a file answers "what does this say" and nothing else. A
 * table answers the questions a directory cannot: which components have no
 * examples section, which of them nobody has opened, how many tokens a page
 * costs before you spend them, which pages link to a library that just shipped
 * a breaking change. Those are joins, and joins want rows.
 *
 * Nothing reads these to render a page. The site still globs Markdown at build
 * time and would render identically with this database switched off.
 */

/**
 * Which catalogue a document came from. `source` is code, not prose.
 *
 * Nine, and the ninth is the one worth explaining. `note` is everything in
 * `.claude/` that is not a skill - the pipeline, the convention rules, the
 * checklists. They are documents by every test that matters here (they are
 * Markdown, they have a path, they cost tokens to read) and they are not
 * skills, so calling them one would make `skills` return files no runtime can
 * load.
 *
 * This list is duplicated in four places on purpose, and asserted in all of
 * them. A type cannot be iterated and an array cannot be a column's type, so
 * the same kinds exist here as a union, in `documents.schemas.ts` as an array
 * a `<select>` is built from, in `packages/cli/mcp/docs.mjs` as a classifier,
 * and in `packages/cli/commands/graphql.mjs` as the source of the GraphQL
 * enum.
 *
 * `checkDocumentKindsAgree` in `scripts/doctor.mjs` compares them. This
 * comment used to claim `documents.schemas.test.ts` did, and that file has
 * never existed - so the guard everybody trusted was a sentence. The failure
 * it guards against is a filter that silently returns nothing.
 */
export type DocumentKind =
	| "component"
	| "package"
	| "post"
	| "page"
	| "desk"
	| "skill"
	| "note"
	| "collection"
	| "task"
	| "graph"
	| "insight"
	| "template"
	| "config"
	| "plugin"
	| "repo"
	| "source";

/**
 * One row per document or source file in this repository.
 *
 * The body is stored, which looks like the copy this file argues against and
 * is not: nothing reads it to serve a page, and `sync` overwrites it wholesale
 * from disk. It is here so a remote reader can answer a question without a
 * checkout, which is the entire point of the projection.
 *
 * `sha` is the content hash, so a sync can skip what has not moved and a
 * reader can tell whether the row it holds is the file it thinks it is.
 */
export const documents = pgTable("documents", {
	/** Repo-relative path. `packages/ui/docs/card/api.md`. */
	path: text("path").primaryKey(),

	kind: text("kind").$type<DocumentKind>().notNull(),

	/** The thing this belongs to: `card`, `http`, `adding-things`. */
	slug: text("slug"),

	/** For component pages: index, get-started, guides, api, examples. */
	section: text("section"),

	/** Site path, when this document is served at one. Null for source files. */
	route: text("route"),

	title: text("title"),
	summary: text("summary"),
	body: text("body").notNull(),

	words: integer("words").notNull().default(0),

	/** Estimated, at four characters per token. Enough to decide before reading. */
	tokens: integer("tokens").notNull().default(0),

	/** SHA-256 of the body. What makes a sync incremental and a row checkable. */
	sha: text("sha").notNull(),

	syncedAt: timestamp("synced_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

/**
 * One row per dependency whose documentation index we keep.
 *
 * `usedFor` is the sentence a lockfile never records: why this dependency, in
 * this repo. It comes from stack.yaml, which is written by hand for exactly
 * that reason.
 */
export const referenceProviders = pgTable("reference_providers", {
	/** Hostname, dashed. `orm-drizzle-team`. */
	provider: text("provider").primaryKey(),

	title: text("title"),

	/** The llms.txt this was cut from. */
	source: text("source").notNull(),

	/** Set when this index was itself listed by another provider's index. */
	parent: text("parent"),

	/** Comma-separated stack entries this serves. */
	usedFor: text("used_for"),

	entries: integer("entries").notNull().default(0),

	fetchedAt: text("fetched_at").notNull(),
});

export type ReferenceProvider = typeof referenceProviders.$inferSelect;

/**
 * One row per page in somebody else's documentation.
 *
 * Links, titles, section names and each provider's own one-line description,
 * taken from the machine-readable index they publish for this purpose. Never
 * page content, here or anywhere else in this repo.
 *
 * That boundary is the whole reason this is safe to store and to share. What
 * is kept is the map: enough to know which page answers a question, and not
 * enough to be a copy of thirty-five projects' documentation. Adding a `body`
 * column here would change what this table is, and it must not be added.
 */
/*
 * Named `reference_pages`, not `references`.
 *
 * REFERENCES is a reserved word in SQL - it is the foreign-key clause - so a
 * table called that has to be quoted in every statement anybody ever writes
 * against it by hand. Drizzle quotes identifiers and would have hidden this
 * forever; the first raw query found it in about a second.
 */

export const referencePages = pgTable("reference_pages", {
	/** `provider` and `url`, hashed. The URL alone is not unique across shards. */
	id: text("id").primaryKey(),

	provider: text("provider").notNull(),
	section: text("section").notNull(),
	name: text("name").notNull(),
	url: text("url").notNull(),
	description: text("description"),
});

export type ReferencePage = typeof referencePages.$inferSelect;
export type NewReferencePage = typeof referencePages.$inferInsert;

/*
 * ── who is asking, and with what ─────────────────────────────────────────
 *
 * Two tables that are sources, not projections, which makes them the first of
 * their kind in this file. Everything above is rebuilt from the repository by
 * `sync` and can be dropped without losing anything. These cannot: a token
 * nobody can reissue and an account nobody can re-derive are the only rows
 * here that a `sync` would destroy rather than refresh.
 *
 * They exist because the gate was one shared secret in an environment
 * variable. That answers "may this request proceed" and no other question -
 * not who is holding it, not when they last used it, not how to stop one
 * holder without stopping all of them. A shared secret has no revocation
 * story, only a rotation story, and rotating it logs everybody out at once.
 *
 * `MCP_AUTH_TOKEN` still works and is still checked first. It is the key to
 * the building, kept for the case where the database is the thing that is
 * broken - a gate that can only be opened by a query cannot be opened when
 * Postgres is down, and that is exactly when somebody needs to get in.
 */

/** How an account first proved who it was. */
export type AccountSource = "owner" | "github" | "magic-link";

/**
 * One row per person or agent that has ever authenticated.
 *
 * Not a user table in the sense the studio cares about - `/studio` is still
 * one login checked against the repository owner, and this changes nothing
 * about that. An account is the thing a token belongs to, so that revoking a
 * person is one statement rather than a hunt through a list of secrets.
 *
 * The email is the identity because that is what a magic link can prove.
 * GitHub sign-in asks for no scopes and therefore learns no email, so an
 * account created that way carries the login instead and the email stays
 * null - which is honest, and is why the column is nullable on a table whose
 * whole point is identity.
 */
export const accounts = pgTable("accounts", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

	/** Lower-cased at the boundary. Unique when present, absent when unproven. */
	email: text("email").unique(),

	/** Set when GitHub is what identified them. Unique for the same reason. */
	githubLogin: text("github_login").unique(),

	/** What they call themselves. Display only, and never trusted for a check. */
	label: text("label"),

	source: text("source").$type<AccountSource>().notNull(),

	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),

	/** Moved by any successful authentication. What makes a dormant account visible. */
	lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
		.notNull()
		.defaultNow(),

	/**
	 * Set to refuse everything this account holds, without deleting the history.
	 *
	 * A delete would take the tokens with it and leave no record that the
	 * account was ever here, which is the wrong tool for "this one turned out to
	 * be a problem" - that is a question somebody asks again in a month.
	 */
	blockedAt: timestamp("blocked_at", { withTimezone: true }),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

/**
 * One row per minted API token.
 *
 * The secret is not here and must not be added. What is stored is its SHA-256,
 * so a reader of this table - a backup, a `drizzle-kit studio` window, me at
 * two in the morning - holds nothing that opens anything. The plaintext exists
 * once, in the response to the mint that created it, and after that it is the
 * holder's problem, which is the only arrangement where "we cannot recover it
 * for you" is true rather than a policy.
 *
 * `prefix` is the first characters of the token, kept deliberately, because a
 * list of tokens nobody can tell apart is a list nobody dares revoke from.
 */
export const apiTokens = pgTable("api_tokens", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

	accountId: uuid("account_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),

	/** What it is for, in the holder's words. `railway cron`, `my laptop`. */
	name: text("name").notNull(),

	/** The public half, e.g. `aj_7f3c…`. Enough to recognise, useless to use. */
	prefix: text("prefix").notNull(),

	/** SHA-256 of the secret, hex. Unique, so a mint collision is a constraint. */
	hash: text("hash").notNull().unique(),

	/**
	 * Space-separated, in the OAuth style, because that is the form the
	 * authorization server this will grow into has to speak anyway.
	 */
	scopes: text("scopes").notNull(),

	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),

	/** Null means it does not expire. A deliberate choice, not an oversight. */
	expiresAt: timestamp("expires_at", { withTimezone: true }),

	/**
	 * Moved on every accepted request, best-effort and never awaited.
	 *
	 * This is the column that makes the table worth having: a token nobody has
	 * used in six months is a token to revoke, and there is no other way to know
	 * that. Writing it costs one statement per authenticated call, which is why
	 * the gate does not wait for it - the answer to "may this proceed" does not
	 * depend on whether the bookkeeping landed.
	 */
	lastUsedAt: timestamp("last_used_at", { withTimezone: true }),

	/** Set rather than deleted, so a revoked token cannot be re-minted by luck. */
	revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export type ApiToken = typeof apiTokens.$inferSelect;
export type NewApiToken = typeof apiTokens.$inferInsert;

/**
 * One row per invitation to collect a token.
 *
 * A magic link, and it is worth being exact about which kind. It does not sign
 * anybody in: `/studio` is still one login checked against the repository
 * owner, and no link changes that. What it does is hand somebody a credential
 * without either of us ever putting the credential in a message - I choose the
 * scopes and the lifetime here, they follow a link, and the token is minted at
 * the moment they collect it and shown only to them.
 *
 * That is the whole reason this table is not a `pending_tokens` table with a
 * secret in it. Nothing that opens anything exists until it is redeemed.
 *
 * The link's own secret is stored the same way a token is: hashed, with a
 * prefix kept in the clear so a listing can tell two invitations apart. A row
 * here is as useless to a reader of the database as a row in `api_tokens`.
 */
export const magicLinks = pgTable("magic_links", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

	/** Who it was sent to, lower-cased. The address the redemption proves. */
	email: text("email").notNull(),

	/** SHA-256 of the link secret, hex. Unique, for the same reason a token's is. */
	hash: text("hash").notNull().unique(),

	/** The public half. Enough to recognise in a list, useless to redeem with. */
	prefix: text("prefix").notNull(),

	/** What the token will be called once this is redeemed. */
	tokenName: text("token_name").notNull(),

	/** What the token will carry. Chosen at invitation, not at redemption. */
	scopes: text("scopes").notNull(),

	/**
	 * How long the minted token will last, in days. Null means it will not
	 * expire - a separate question from how long this link lasts, and the two
	 * are confused often enough to be worth two columns with two names.
	 */
	tokenDays: integer("token_days"),

	/** The account that sent it. Null once that account is deleted, not cascaded. */
	invitedBy: uuid("invited_by").references(() => accounts.id, {
		onDelete: "set null",
	}),

	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),

	/**
	 * When the link stops working, which is soon.
	 *
	 * Minutes rather than days. A link is a bearer credential sitting in an
	 * inbox, and the inbox is the part of this system I have no control over -
	 * so the window in which a copy of that inbox is worth anything is the one
	 * thing here I can make small.
	 */
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

	/**
	 * Set the instant it is redeemed, by a conditional update.
	 *
	 * This column is the single-use guarantee, and it only works because the
	 * write that sets it is the same statement that checks it was null. Reading
	 * first and writing second would leave a window in which two requests both
	 * see an unredeemed link, which is exactly what a double-click and a
	 * link-prefetching mail scanner both produce.
	 */
	redeemedAt: timestamp("redeemed_at", { withTimezone: true }),

	/** What it produced. The join that answers "what did I actually give them". */
	tokenId: uuid("token_id").references(() => apiTokens.id, {
		onDelete: "set null",
	}),

	/** Set to withdraw an invitation that has not been taken up yet. */
	revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export type MagicLink = typeof magicLinks.$inferSelect;
export type NewMagicLink = typeof magicLinks.$inferInsert;

/*
 * ── what may leave this database ─────────────────────────────────────────
 *
 * Every table, and whether it is publishable through the GraphQL schema.
 *
 * This exists because "the schema self-generates from Drizzle" was half true.
 * The *columns* were read from the tables, so a field could never disagree
 * with its column - but *which* tables was three names destructured by hand in
 * the generator, so adding a table to this file did nothing at all. Three
 * tables carrying credentials were added and the graph never noticed, which is
 * the good outcome of a bad mechanism: it was safe by accident.
 *
 * Accidents are not a security boundary, so the generator now reads this and
 * refuses to run when a table is missing from it. That turns adding a table
 * into a decision somebody has to write down, and makes the two failures it
 * guards against impossible rather than unlikely:
 *
 *   a new table is silently exposed   - it cannot be; unclassified fails
 *   a new table is silently forgotten - it cannot be; unclassified fails
 *
 * `private` is not a weaker `public`. It means the rows are a liability to
 * hand out, and the reason is written next to each one.
 */
export const GRAPHQL_EXPOSURE: Readonly<Record<string, "public" | "private">> =
	{
		/* The projection. Public because it is a map of a public repository. */
		documents: "public",
		reference_providers: "public",
		reference_pages: "public",

		/*
		 * Private: credentials and the people holding them.
		 *
		 * `api_tokens` stores hashes, so exposing it would not hand anybody a key -
		 * and it would hand them the prefix, the scopes, the expiry and the holder
		 * of every key that exists, which is a map of what to attack and who to
		 * ask. `magic_links` is the same argument before the credential exists.
		 * `accounts` is somebody's email address.
		 */
		accounts: "private",
		api_tokens: "private",
		magic_links: "private",

		/*
		 * Private for a duller reason: nobody has asked. These are counters and
		 * votes, and a field nothing queries is a field that still has to be kept
		 * working. They become public the day something wants them.
		 */
		page_views: "private",
		page_feedback: "private",
	};

/*
 * schema.org, as the shape of the JSON-LD a page emits.
 *
 * Every element that shows content has a type at schema.org that already
 * describes it, and there is no reason to invent a second vocabulary beside
 * one that a search engine, a reader mode and another agent all already parse.
 *
 * There is deliberately no table behind this. One existed, keyed by type and
 * slug, and nothing ever wrote to it: every page builds its JSON-LD from what
 * it already has in hand - the video block from its own Markdown attributes,
 * a component page from its registry entry - because that content is a file
 * in this repo, not a row. Storing it would have been a copy that drifts.
 *
 * `SchemaTypeName` still comes from the generated vocabulary, and
 * `schemaProperties()` in `@sushindustries/db/schema-org` still validates
 * against it. That module is a separate entry because the vocabulary is
 * ninety kilobytes and only the type name is needed here; a type import
 * costs nothing at runtime.
 *
 * https://schema.org/Thing
 */

/**
 * The half of a thing that describes it rather than the row it sits in.
 *
 * A page usually has this to hand without a database - the video block builds
 * one from its own Markdown attributes - so the serialiser takes this, and a
 * stored row satisfies it by being a superset.
 */
export interface ThingFields {
	readonly type: SchemaTypeName;
	readonly name: string;
	readonly description?: string | null;
	readonly url?: string | null;
	readonly image?: string | null;
	readonly properties?: Readonly<Record<string, unknown>>;
}

/**
 * One thing, as schema.org JSON-LD.
 *
 * Empty values are dropped rather than serialised as null: a consumer reading
 * `"uploadDate": null` has been told something false, where a missing key only
 * says nothing. Dates are ISO strings, which is what the standard asks for and
 * what a `Date` from a row is not.
 */
export function thingLd(thing: ThingFields): object {
	const entries: Array<[string, unknown]> = [
		["@context", "https://schema.org"],
		["@type", thing.type],
		["name", thing.name],
		["description", thing.description],
		["url", thing.url],
		["image", thing.image],
		...Object.entries(thing.properties ?? {}),
	];

	return Object.fromEntries(
		entries
			.map(([key, value]) => [
				key,
				value instanceof Date ? value.toISOString() : value,
			])
			.filter(
				([, value]) => value !== undefined && value !== null && value !== "",
			),
	);
}

/*
 * The query builders, re-exported.
 *
 * So that a consumer needs one dependency rather than two. Importing
 * `drizzle-orm` directly in the app would mean a second copy of the version
 * pinned here, and the way that goes wrong is not a missing module - it is two
 * `eq` functions that build subtly different SQL against one schema, which
 * looks like a query bug and is a dependency bug.
 *
 * Client-safe, like the rest of this file: these are pure builders that produce
 * an object describing a query. Nothing here opens a connection - that is
 * `client.server.ts`, which cannot be imported from a browser at all.
 */
export { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
