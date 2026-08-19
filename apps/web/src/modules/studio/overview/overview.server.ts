import { createHash } from "node:crypto";
import { getDb } from "@sushindustries/db/client";
import {
	documents,
	pageFeedback,
	pageViews,
	referencePages,
	referenceProviders,
	sql,
} from "@sushindustries/db/schema";

/*
 * What is in the database, in one query's worth of answers.
 *
 * The question a database browser was being opened to answer, without the
 * browser: how much is in there, when it was written, and whether the last
 * sync did what it was supposed to. Everything here is an aggregate - no row
 * bodies, no page text - so it stays small enough to read whole and carries
 * nothing worth protecting beyond the fact that it is production.
 *
 * `.server.ts` because it opens a connection.
 */

export interface StudioReport {
	readonly revision: string;
	readonly syncedAt: string | null;
	readonly tables: Readonly<Record<string, number>>;
	readonly documentsByKind: readonly {
		kind: string;
		files: number;
		tokens: number;
	}[];
	readonly providers: readonly { provider: string; entries: number }[];
	readonly mostViewed: readonly { path: string; views: number }[];
	readonly heaviest: readonly { path: string; tokens: number }[];
}

export async function studioReport(): Promise<StudioReport> {
	const client = getDb();

	const [counts] = await client.execute<{
		documents: number;
		reference_pages: number;
		reference_providers: number;
		page_views: number;
		page_feedback: number;
		synced_at: Date | null;
	}>(sql`
		select
			(select count(*)::int from ${documents}) as documents,
			(select count(*)::int from ${referencePages}) as reference_pages,
			(select count(*)::int from ${referenceProviders}) as reference_providers,
			(select count(*)::int from ${pageViews}) as page_views,
			(select count(*)::int from ${pageFeedback}) as page_feedback,
			(select max(synced_at) from ${documents}) as synced_at
	`);

	const byKind = await client.execute<{
		kind: string;
		files: number;
		tokens: number;
	}>(sql`
		select kind, count(*)::int as files, coalesce(sum(tokens), 0)::int as tokens
		from ${documents} group by kind order by tokens desc
	`);

	const providers = await client.execute<{ provider: string; entries: number }>(
		sql`select provider, entries from ${referenceProviders} order by entries desc limit 10`,
	);

	const viewed = await client.execute<{ path: string; views: number }>(
		sql`select path, views from ${pageViews} order by views desc limit 10`,
	);

	const heaviest = await client.execute<{ path: string; tokens: number }>(
		sql`select path, tokens from ${documents} order by tokens desc limit 10`,
	);

	/*
	 * The same revision the graph reports, computed the same way: a hash over
	 * every content hash in path order. Two surfaces disagreeing about whether
	 * anything changed would be worse than neither reporting it.
	 */
	const shas = await client.execute<{ sha: string }>(
		sql`select sha from ${documents} order by path asc`,
	);
	const digest = createHash("sha256");
	for (const row of shas) digest.update(row.sha);

	return {
		revision: digest.digest("hex").slice(0, 16),
		syncedAt: counts?.synced_at
			? new Date(counts.synced_at).toISOString()
			: null,
		tables: {
			documents: counts?.documents ?? 0,
			reference_pages: counts?.reference_pages ?? 0,
			reference_providers: counts?.reference_providers ?? 0,
			page_views: counts?.page_views ?? 0,
			page_feedback: counts?.page_feedback ?? 0,
		},
		documentsByKind: [...byKind],
		providers: [...providers],
		mostViewed: [...viewed],
		heaviest: [...heaviest],
	};
}
