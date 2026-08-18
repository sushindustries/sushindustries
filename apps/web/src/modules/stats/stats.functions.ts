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
export const countPackageView = createServerFn({ method: "POST" })
	.inputValidator((slug: string) => slug)
	.handler(async ({ data }) => {
		await countView(data);
		return (await readViews(data))?.views ?? null;
	});
