import { getDb } from "@sushindustries/db/client";
import {
	and,
	documents,
	eq,
	pageViews,
	referencePages,
	sql,
} from "@sushindustries/db/schema";
import { listCollections } from "../collections/collections.catalogue";
import { type HubBar, hubConfig } from "../studio.catalogue";

/*
 * The numbers behind the hub's chart.
 *
 * Which bars exist is `content/studio/hub.md`; this is what each one resolves
 * to. The split is the point - the shape of the chart is content and the
 * counting is code, so adding a bar never means touching a query and changing
 * a query never means editing content.
 *
 * One statement for all of them. A loop of `count(*)` per bar would be correct
 * and would also be six round trips to draw six bars, which is six times the
 * latency for a decoration at the top of a page. Every count is a scalar
 * subquery in one select instead.
 *
 * `.server.ts` because it opens a connection.
 */

export interface HubBarValue {
	readonly id: string;
	readonly label: string;
	readonly value: number;
}

/**
 * The SQL for one bar, as a fragment.
 *
 * `collections` is the odd one and is not a query at all: collections are
 * files globbed at build time, so their count is known without asking
 * Postgres. Returning it as a literal keeps every bar the same shape to the
 * caller rather than making the chart special-case one source.
 */
function fragment(bar: HubBar, measure: "count" | "tokens") {
	const column =
		measure === "tokens"
			? sql`coalesce(sum(${documents.tokens}), 0)::int`
			: sql`count(*)::int`;

	switch (bar.source.of) {
		case "documents":
			return bar.source.kind
				? sql`(select ${column} from ${documents} where ${documents.kind} = ${bar.source.kind})`
				: sql`(select ${column} from ${documents})`;

		case "references":
			// `tokens` means nothing here - a reference page is a link and a
			// title, never a body - so this counts rows either way rather than
			// summing a column that does not exist.
			return sql`(select count(*)::int from ${referencePages})`;

		case "views":
			// The measure is views, not rows: ten pages opened once is a smaller
			// number than one page opened a hundred times, and the second is what
			// the bar is about.
			return sql`(select coalesce(sum(${pageViews.views}), 0)::int from ${pageViews})`;

		case "collections":
			return sql`${listCollections().length}::int`;
	}
}

export async function getHubBars(): Promise<readonly HubBarValue[]> {
	const config = hubConfig();
	if (config.bars.length === 0) return [];

	/*
	 * Aliased by position rather than by the bar's own id.
	 *
	 * A label in `hub.md` can be anything somebody types, and an id derived
	 * from it would be arriving in a SQL identifier. `b0`, `b1`, `b2` cannot
	 * be, and the mapping back is the array index it came from.
	 */
	const columns = config.bars.map(
		(bar, at) =>
			sql`${fragment(bar, config.measure)} as b${sql.raw(String(at))}`,
	);

	const [row] = await getDb().execute<Record<string, number>>(
		sql`select ${sql.join(columns, sql`, `)}`,
	);

	return config.bars.map((bar, at) => ({
		id: bar.id,
		label: bar.label,
		value: Number(row?.[`b${at}`] ?? 0),
	}));
}

/**
 * How stale the projection is, in one boolean the hub can act on.
 *
 * Six hours, chosen against how often a sync actually runs rather than
 * against anything principled: a projection that has not moved in a working
 * day is one somebody forgot, and saying so on the hub is cheaper than
 * noticing a wrong number three screens in.
 */
export async function isStale(): Promise<boolean> {
	const [row] = await getDb()
		.select({ synced: sql<Date | null>`max(${documents.syncedAt})` })
		.from(documents)
		.where(and(eq(sql`1`, sql`1`)));

	if (!row?.synced) return true;
	return Date.now() - new Date(row.synced).getTime() > 6 * 60 * 60 * 1000;
}
