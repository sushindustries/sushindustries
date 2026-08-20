import { getDb } from "@sushindustries/db/client";
import { and, documents, eq, sql } from "@sushindustries/db/schema";
/*
 * `RegistryItem` comes from the package rather than from the site's catalogue,
 * because the catalogue imports it from there too - it is the package that
 * owns what an item is, and the site only reads it.
 */
import type { RegistryItem } from "@sushindustries/ui/registry";
import { findRegistryItem, listRegistry } from "../registry/registry.catalogue";

/*
 * Elements, as a graph of shards.
 *
 * Two sources, and which answers what is the whole design:
 *
 *   the registry     what an element *is* - its version, its parts, its
 *                    variants. Authored, inlined at build time, never stale.
 *   the projection   what its documentation *costs* - tokens and content
 *                    hashes per section. Synced, so it can be behind.
 *
 * Neither could answer alone. The registry has no idea what a page weighs and
 * the database has no idea that `nav-bar` is built out of five other things.
 * Joining them is what makes a shard address useful: it carries both the
 * structure and the price.
 *
 * `.server.ts` because it opens a connection.
 */

/**
 * One addressable piece of an element.
 *
 * Declared rather than inferred, because inference narrows to whatever the
 * first array literal held - `facet` became `"DOCS"` and every later push was
 * a type error. Naming the shape once is also what lets `sha` and `section` be
 * honestly nullable: a computed facet has no file to hash, and only `docs` has
 * sections.
 */
export interface ElementShard {
	readonly facet: "DOCS" | "SOURCE" | "DEPS" | "VARIANTS";
	readonly section: string | null;
	readonly path: string;
	readonly tokens: number;
	readonly sha: string | null;
}

/** One shard's worth of cost, keyed by `slug:section`. */
type Weights = Map<string, { tokens: number; sha: string }>;

/*
 * ── the cache, and why it is not optional ──────────────────────────────
 *
 * `weights()` and `sourceWeights()` are each a full scan of a partition of
 * `documents`, and `getElement` calls both. That was fine for one element and
 * catastrophic the moment `parts` became a field resolver: asking
 * `elements { parts { name } }` resolves seventy three elements and then one
 * `getElement` per edge, so the same two scans ran over a hundred times.
 *
 * Measured before fixing, which is the only reason the numbers are here:
 *
 *   element(name:) { name }                    834ms
 *   element { parts { name } }               2,003ms
 *   element { parts { parts { name } } }     2,454ms
 *   elements { parts { name } }              4,921ms
 *
 * The cache is keyed on the projection's own revision - the newest `syncedAt`
 * across every document - so it invalidates itself the instant a sync writes
 * new rows, and never serves a stale answer for longer than one cheap
 * `max()`. A time-based TTL would have been fewer lines and would be wrong in
 * exactly the window somebody runs a sync and reloads the page to check it.
 *
 * Not a DataLoader. The problem is not batching identical keys within a tick;
 * it is that two whole-table reads are being repeated. One shared snapshot per
 * revision is the smaller and more honest fix.
 */
let cached: {
	revision: number;
	docs: Weights;
	source: Map<string, number>;
} | null = null;

/**
 * The projection's revision, as the newest sync timestamp.
 *
 * One indexed `max()` rather than a hash of every row: this runs on every
 * request that touches an element, so it has to be the cheapest question that
 * still changes when the data does. A sync stamps every row it writes, so the
 * maximum moving is exactly the event the cache needs to hear about.
 */
async function revision(): Promise<number> {
	const [row] = await getDb()
		.select({ at: sql<Date | null>`max(${documents.syncedAt})` })
		.from(documents);

	return row?.at ? new Date(row.at).getTime() : 0;
}

/** Both scans, shared across every element in one request and beyond. */
async function snapshot(): Promise<{
	docs: Weights;
	source: Map<string, number>;
}> {
	const at = await revision();
	if (cached?.revision === at) return cached;

	const [docs, source] = await Promise.all([weights(), sourceWeights()]);
	cached = { revision: at, docs, source };
	return cached;
}

/**
 * Every component doc's weight, in one query.
 *
 * One statement for the whole registry rather than one per element. Seventy
 * three elements with five sections each is three hundred and sixty five round
 * trips the obvious way, to build a list somebody reads once.
 */
async function weights(): Promise<Weights> {
	const rows = await getDb()
		.select({
			slug: documents.slug,
			section: documents.section,
			tokens: documents.tokens,
			sha: documents.sha,
		})
		.from(documents)
		.where(eq(documents.kind, "component"));

	const found: Weights = new Map();
	for (const row of rows) {
		if (!row.slug || !row.section) continue;
		found.set(`${row.slug}:${row.section}`, {
			tokens: row.tokens,
			sha: row.sha,
		});
	}
	return found;
}

/**
 * What the source files weigh, per element.
 *
 * Source rows are keyed by their filename rather than by the element, so this
 * sums the files an element actually lists rather than guessing from the slug
 * - `folder-shelf` copies five files and only one of them is named after it.
 */
async function sourceWeights(): Promise<Map<string, number>> {
	const rows = await getDb()
		.select({ path: documents.path, tokens: documents.tokens })
		.from(documents)
		.where(
			and(
				eq(documents.kind, "source"),
				sql`${documents.path} like 'packages/ui/src/%'`,
			),
		);

	const byFile = new Map<string, number>();
	for (const row of rows) {
		byFile.set(row.path.replace("packages/ui/src/", ""), row.tokens);
	}

	const byElement = new Map<string, number>();
	for (const item of listRegistry()) {
		byElement.set(
			item.name,
			item.files.reduce((sum, file) => sum + (byFile.get(file) ?? 0), 0),
		);
	}
	return byElement;
}

const DOC_SECTIONS = [
	"index",
	"get-started",
	"guides",
	"api",
	"examples",
] as const;

const address = (item: RegistryItem, facet: string, section?: string) =>
	`/${item.name}/${item.version}/${facet}${section ? `/${section}` : ""}`;

/**
 * Every shard of one element, with what each costs.
 *
 * `docs` sections that do not exist are omitted rather than reported as zero.
 * A shard address that resolves to nothing is worse than a missing one: a
 * client fetches it, gets an empty body, and cannot tell that apart from a
 * section somebody has not written yet.
 */
function shardsFor(
	item: RegistryItem,
	docs: Weights,
	source: Map<string, number>,
) {
	const shards: ElementShard[] = DOC_SECTIONS.flatMap<ElementShard>(
		(section) => {
			const weight = docs.get(`${item.name}:${section}`);
			if (!weight) return [];

			return [
				{
					facet: "DOCS",
					section,
					path: address(item, "docs", section),
					tokens: weight.tokens,
					sha: weight.sha,
				},
			];
		},
	);

	shards.push({
		facet: "SOURCE",
		section: null,
		path: address(item, "source"),
		tokens: source.get(item.name) ?? 0,
		sha: null,
	});

	/*
	 * `deps` and `variants` are computed rather than stored, so they have no
	 * content hash - there is no file to hash. Their token cost is an estimate
	 * of the JSON a caller would receive, which is small and worth reporting
	 * anyway so that every shard in the list can be added up.
	 */
	const depsSize =
		Object.keys(item.dependencies).length * 12 +
		(item.registryDependencies?.length ?? 0) * 8;

	shards.push({
		facet: "DEPS",
		section: null,
		path: address(item, "deps"),
		tokens: depsSize,
		sha: null,
	});

	if (item.variants?.length) {
		shards.push({
			facet: "VARIANTS",
			section: null,
			path: address(item, "variants"),
			tokens: item.variants.reduce(
				(sum: number, one) => sum + Math.ceil(one.about.length / 4) + 6,
				0,
			),
			sha: null,
		});
	}

	return shards;
}

/** The inverse of `registryDependencies`, built once for the whole registry. */
function inverse(): Map<string, string[]> {
	const found = new Map<string, string[]>();
	for (const item of listRegistry()) {
		for (const part of item.registryDependencies ?? []) {
			found.set(part, [...(found.get(part) ?? []), item.name]);
		}
	}
	return found;
}

const shape = (
	item: RegistryItem,
	docs: Weights,
	source: Map<string, number>,
	partOf: Map<string, string[]>,
) => {
	const shards = shardsFor(item, docs, source);

	return {
		name: item.name,
		version: item.version,
		title: item.title,
		description: item.description,
		kind: (item.kind ?? "component").toUpperCase(),
		category: item.category,
		subcategory: item.subcategory ?? null,
		tags: [...(item.tags ?? [])],
		/*
		 * Names now, resolved by the field resolvers. Resolving them here would
		 * recurse: a block's parts have parts, and `folder-shelf` includes
		 * `context-menu` which includes `icon`.
		 */
		partNames: item.registryDependencies ?? [],
		partOfNames: partOf.get(item.name) ?? [],
		variants: (item.variants ?? []).map((one) => ({
			prop: one.prop,
			value: one.value,
			about: one.about,
			isDefault: Boolean(one.default),
		})),
		shards,
		tokens: shards.reduce((sum: number, one) => sum + one.tokens, 0),
	};
};

export type ShapedElement = ReturnType<typeof shape>;

export async function getElements(args: {
	/*
	 * `null` as well as absent, because that is what a GraphQL optional
	 * argument is: the schema's `kind: DocumentKind` arrives as `null` when the
	 * caller omitted it, and a signature that only accepts `undefined` makes
	 * the resolver cast on the way in.
	 */
	kind?: string | null;
	category?: string | null;
}): Promise<ShapedElement[]> {
	const { docs, source } = await snapshot();
	const partOf = inverse();

	return listRegistry()
		.filter((item) => {
			if (args.kind && (item.kind ?? "component").toUpperCase() !== args.kind) {
				return false;
			}
			return !args.category || item.category === args.category;
		})
		.map((item) => shape(item, docs, source, partOf))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getElement(name: string): Promise<ShapedElement | null> {
	const item = findRegistryItem(name);
	if (!item) return null;

	const { docs, source } = await snapshot();
	return shape(item, docs, source, inverse());
}

/**
 * One shard, from its address.
 *
 * The version segment is checked when present and ignored when it is not, so
 * `/nav-bar/docs/api` resolves to whatever is current. Convenient, and the
 * form to avoid pinning against - which is what the version exists for.
 */
export async function getElementShard(path: string) {
	const parts = path.replace(/^\//, "").split("/").filter(Boolean);
	const [name, ...rest] = parts;
	if (!name) return null;

	const item = findRegistryItem(name);
	if (!item) return null;

	// A segment that looks like a version is one; otherwise the caller left it
	// out and everything after the name is the facet.
	const versioned = /^\d+\.\d+\.\d+$/.test(rest[0] ?? "");
	if (versioned && rest[0] !== item.version) return null;

	const [facet, section] = versioned ? rest.slice(1) : rest;
	if (!facet) return null;

	const { docs, source } = await snapshot();

	return (
		shardsFor(item, docs, source).find(
			(one) =>
				one.facet === facet.toUpperCase() &&
				(one.section ?? null) === (section ?? null),
		) ?? null
	);
}
