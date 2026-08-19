/*
 * The page roster, from the sitemap.
 *
 * /sitemap.xml is a <sitemapindex> of per-section shards, so the roster is
 * two hops: read the index, then read each shard it names. Kept tolerant of
 * a flat urlset too, so the tests keep working if the sharding is ever
 * reverted - the roster is the contract, not the shape it arrives in.
 */

function locs(xml: string): string[] {
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
		(match) => match[1] ?? "",
	);
}

export async function sitemapPagePaths(base: string): Promise<string[]> {
	const root = await (await fetch(`${base}/sitemap.xml`)).text();

	if (!root.includes("<sitemapindex")) {
		return locs(root).map((loc) => new URL(loc).pathname);
	}

	const shards = await Promise.all(
		locs(root).map(async (shard) =>
			locs(await (await fetch(new URL(shard, base))).text()),
		),
	);

	return shards.flat().map((loc) => new URL(loc).pathname);
}
