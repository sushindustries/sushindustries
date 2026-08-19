import type { PageKind } from "@sushindustries/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { countView, readViews } from "./stats.server";

/*
 * The loader-facing half of the view counter.
 *
 * A route loader runs on the server during SSR and *in the browser* on every
 * client-side navigation, and `stats.server.ts` is deny-listed from client
 * bundles by its suffix - so the loader cannot call it directly. This server
 * function is the bridge: the loader calls it from either side, and the
 * counting always happens where the database is.
 *
 * One round trip does both jobs - record the view, return the new total -
 * because a loader that made two requests to show one number would be paying
 * twice for a decoration.
 *
 * `null` when there is no database, same contract as everything in
 * `stats.server.ts`: the page renders no number rather than an error.
 */

/** The catalogues a page can belong to, and the path each one lives under. */
const KINDS: Record<PageKind, string> = {
	component: "/components/",
	package: "/packages/",
	post: "/posts/",
	page: "/p/",
};

/*
 * A slug is a directory or file name: the same charset the registry check
 * enforces, with a length cap the column does not have.
 */
const SLUG = /^[a-z][a-z0-9-]{0,63}$/;

function isKind(value: unknown): value is PageKind {
	return typeof value === "string" && value in KINDS;
}

export const countPageView = createServerFn({ method: "POST" })
	/*
	 * A runtime constraint, not a type assertion. A validator that hands its
	 * argument back checks nothing once the request has left TypeScript, and
	 * this is a POST any same-origin page can issue that writes a row keyed by
	 * whatever it is handed. Both halves are checked here, so the path this
	 * builds can only ever be one a catalogue could have produced.
	 */
	.validator((input: unknown) => {
		const { kind, slug } = (input ?? {}) as { kind?: unknown; slug?: unknown };

		if (!isKind(kind)) throw new Error("not a page kind");
		if (typeof slug !== "string" || !SLUG.test(slug)) {
			throw new Error("not a page slug");
		}

		return { kind, slug };
	})
	.handler(async ({ data }) => {
		const path = `${KINDS[data.kind]}${data.slug}`;

		await countView(path, data.kind);
		return (await readViews(path))?.views ?? null;
	});
