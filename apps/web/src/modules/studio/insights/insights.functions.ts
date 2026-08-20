import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { openSession } from "../../content/github-auth.server";
import { getInsights } from "./insights.server";

/*
 * The bridge between the browser and the insights feature.
 *
 * The session is checked here rather than in the route, because a server
 * function is an HTTP endpoint whether or not a route calls it.
 */

function requireSession(): string {
	const session = openSession(getRequest());
	if (!session) throw new Error("Not signed in.");
	return session.login;
}

/** Every insight, answered. */
export const listStudioInsights = createServerFn({ method: "GET" }).handler(
	async () => {
		requireSession();
		return getInsights();
	},
);
