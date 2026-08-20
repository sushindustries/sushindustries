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
 * The report: what the projection holds, how old it is, and what it cost.
 *
 * This directory held two features until they were separated. `hub.*` drew the
 * chart on `/studio` and `overview.*` answered the header and `/studio/report`,
 * they shared no code and no import, and they shared a directory - so one
 * folder carried two naming schemes and a reader had to open a file to learn
 * which of the two it belonged to. The hub is now `../hub/`, and this is only
 * the report.
 */

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

	const countsQuery = client.execute<{
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

	const byKindQuery = client.execute<{
		kind: string;
		files: number;
		tokens: number;
	}>(sql`
		select kind, count(*)::int as files, coalesce(sum(tokens), 0)::int as tokens
		from ${documents} group by kind order by tokens desc
	`);

	const providersQuery = client.execute<{ provider: string; entries: number }>(
		sql`select provider, entries from ${referenceProviders} order by entries desc limit 10`,
	);

	const viewedQuery = client.execute<{ path: string; views: number }>(
		sql`select path, views from ${pageViews} order by views desc limit 10`,
	);

	const heaviestQuery = client.execute<{ path: string; tokens: number }>(
		sql`select path, tokens from ${documents} order by tokens desc limit 10`,
	);

	/*
	 * The same revision the graph reports, computed the same way: a hash over
	 * every content hash in path order. Two surfaces disagreeing about whether
	 * anything changed would be worse than neither reporting it.
	 */
	const shasQuery = client.execute<{ sha: string }>(
		sql`select sha from ${documents} order by path asc`,
	);

	/*
	 * Six statements, one wait.
	 *
	 * They were six sequential `await`s, which is six round trips one after
	 * another - and the database is Railway's over a TCP proxy, so each is
	 * network latency rather than query time. Every studio page inherits this
	 * loader, so every studio page paid for all six in series: `/studio` took
	 * 2.7 seconds to answer with nothing in it that was slow.
	 *
	 * None of them depends on another. Issuing them together turns six
	 * latencies into one, and `postgres` pipelines them on the single
	 * connection without any pool configuration.
	 */
	const [counts, byKind, providers, viewed, heaviest, shas] = await Promise.all(
		[
			countsQuery,
			byKindQuery,
			providersQuery,
			viewedQuery,
			heaviestQuery,
			shasQuery,
		],
	);

	const digest = createHash("sha256");
	for (const row of shas) digest.update(row.sha);

	return {
		revision: digest.digest("hex").slice(0, 16),
		syncedAt: counts[0]?.synced_at
			? new Date(counts[0].synced_at as Date).toISOString()
			: null,
		tables: {
			documents: counts[0]?.documents ?? 0,
			reference_pages: counts[0]?.reference_pages ?? 0,
			reference_providers: counts[0]?.reference_providers ?? 0,
			page_views: counts[0]?.page_views ?? 0,
			page_feedback: counts[0]?.page_feedback ?? 0,
		},
		documentsByKind: [...byKind],
		providers: [...providers],
		mostViewed: [...viewed],
		heaviest: [...heaviest],
	};
}
