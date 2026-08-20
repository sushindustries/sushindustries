import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { overviewQueryOptions } from "../modules/studio/overview/overview-query-keys";
import { StudioHeader } from "../modules/studio/studio-header";

/*
 * The studio, and the one gate everything under it is behind.
 *
 * A layout route rather than a page. `/studio` used to be a leaf that rendered
 * the report; it is now a shell with tabs, and the report is `studio.index.tsx`
 * beneath it. That change is what makes the gate worth having in one place:
 * every child inherits this loader, so a route added later is signed-in by
 * default rather than by somebody remembering.
 *
 * Not Drizzle Studio. That is a read-write database client in beta, and putting
 * one on a public origin is a different class of risk from anything else here -
 * a bug in it is a bug in production data. This answers the questions Studio
 * was being opened for: what is in there, how old is it, and what is each thing
 * called. `pnpm sushindustries studio` remains the way to browse raw rows, over
 * the TCP proxy, from a machine that is already trusted.
 *
 * Nothing here imports a `.server.ts`. This route has a component, so it is in
 * the client bundle, and import protection failed the build the first time it
 * tried - correctly. The `.functions.ts` files are what stand between.
 */
export const Route = createFileRoute("/studio")({
	/*
	 * The gate is the loader, and the redirect is its answer.
	 *
	 * A loader runs before anything renders, so an unsigned-in visitor is sent
	 * to GitHub without the page or its data ever being built. Deciding inside
	 * the component would mean rendering the shell first, which is how a private
	 * page flashes its own chrome at somebody who may not see it.
	 *
	 * It is not the only check. Every server function under here checks the
	 * session itself, because a server function is an HTTP endpoint whether or
	 * not a route calls it - a guard that only protects the page is a guard that
	 * looks correct in a screenshot.
	 */
	loader: async ({ context }) => {
		/*
		 * `ensureQueryData` rather than a bare call, so the gate and the header
		 * are one fetch. The loader still has to hold the answer - the redirect
		 * below cannot wait for a component - and filling the cache with it means
		 * the header reads the same object through `useQuery` and can be
		 * invalidated afterwards, which as loader data it could not be.
		 */
		const view = await context.queryClient.ensureQueryData(
			overviewQueryOptions(),
		);

		/*
		 * The destination comes back with the answer rather than being written
		 * here, because which door to offer depends on the environment and the
		 * host - and this file is in the client bundle, where neither is visible.
		 *
		 * It used to be a literal `/auth/github`, which was wrong on a laptop:
		 * this repo's OAuth app has one callback URL and it points at the
		 * deployment, so signing in locally bounced to a flow that could not
		 * finish. The only way in was knowing `/auth/dev` existed.
		 */
		if (!("login" in view)) throw redirect({ href: view.signInHref });
	},
	component: Studio,
	head: () => ({
		meta: [
			{ title: "Studio" },
			// Never indexed. It is behind a sign-in, and a search result for a page
			// nobody but me can open wastes everyone's time.
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

function Studio() {
	/*
	 * Read from the cache the loader filled, not from loader data. The two would
	 * hold the same object on first paint and diverge the moment anything
	 * invalidated the projection - and the header is precisely the thing that
	 * has to notice when it does.
	 */
	const view = useQuery(overviewQueryOptions());

	// The loader redirected anybody without a session, so by here there is one.
	if (!view.data || !("login" in view.data)) return null;

	const { report, login } = view.data;

	/*
	 * `container` is the page's own width and gutters - the same one every other
	 * page uses, so the studio starts at the same left edge as everything else.
	 * It was `wrap` here, which is `flex-wrap: wrap` in the utilities and is not
	 * a container at all: the page had no max width and no gutter, which is most
	 * of what "no distance from the margins" was.
	 *
	 * `cq` opts the subtree into container queries, so the workbench inside can
	 * ask how much room it was given rather than how wide the window is.
	 */
	return (
		<main className="container cq flex col gap-6 py-7">
			<StudioHeader report={report} login={login} />
			<Outlet />
		</main>
	);
}
