/*
 * The edge cache policy, decided by one fact about this site.
 *
 * Everything this server answers with is derived from the repository at build
 * time: the pages, the registry endpoints, the graph, `llms.txt`. Nothing is
 * per-user - no sessions, no personalisation, no `Set-Cookie` anywhere. That
 * single fact is the whole policy: any successful GET may be cached at
 * Railway's edge and shared between visitors, because every visitor was going
 * to receive the same bytes anyway.
 *
 * The numbers, and what each one buys:
 *
 *   `max-age=0`                     browsers revalidate every time, so a
 *                                   deploy reaches repeat visitors immediately
 *   `s-maxage=300`                  the edge keeps a response five minutes
 *   `stale-while-revalidate=86400`  for a day after that, answer from cache
 *                                   now and refresh behind - nobody waits
 *   `stale-if-error=604800`         a week of the last good copy if the
 *                                   origin is down
 *
 * Railway purges cached HTML on every deploy, so five minutes is the worst
 * case for a change that ships - the purge makes it seconds.
 *
 * Guard rails this leans on rather than restates: the edge refuses to cache a
 * response carrying `Set-Cookie` or `Cache-Control: private`, and never caches
 * anything but GET and HEAD. A mistake here degrades to "not cached", never to
 * "somebody else's page".
 */

/**
 * The policy itself, exported for the one place that cannot call
 * `cacheControl`: Nitro's route rules. A prerendered page and a file in
 * `public/` are answered by the static layer before any middleware runs, so
 * they can only be given headers declaratively - and a declaration that
 * restated these five values was a second copy with a comment asking to be
 * kept in sync. Importing it is how they agree.
 */
export const PAGE_CACHE_POLICY = [
	"public",
	"max-age=0",
	"s-maxage=300",
	"stale-while-revalidate=86400",
	"stale-if-error=604800",
].join(", ");

/**
 * The `Cache-Control` a response should carry, or nothing.
 *
 * Nothing when the method is not GET, the response is not a success, or
 * something closer to the route already chose a policy - a header set here
 * must never overrule one set on purpose.
 */
export function cacheControl(
	request: Request,
	response: Response,
): string | undefined {
	if (request.method !== "GET") return undefined;
	if (!response.ok) return undefined;
	if (response.headers.has("cache-control")) return undefined;

	return PAGE_CACHE_POLICY;
}
