import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { openSession } from "../../content/github-auth.server";
import { getInsight, getInsights } from "./insights.server";

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

/** One insight, for a page that shows a single question. */
export const readStudioInsight = createServerFn({ method: "GET" })
	.validator((input: unknown) => {
		const { id } = (input ?? {}) as { id?: unknown };
		if (typeof id !== "string" || id.length === 0) {
			throw new Error("An insight id is required.");
		}
		return { id };
	})
	.handler(async ({ data }) => {
		requireSession();
		return getInsight(data.id);
	});
