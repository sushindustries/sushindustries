import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { readStudio } from "../modules/studio/overview/overview.functions";
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
	loader: async () => {
		const view = await readStudio();
		if (!view) throw redirect({ href: "/auth/github" });
		return view;
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
	const { report, login } = Route.useLoaderData();

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
