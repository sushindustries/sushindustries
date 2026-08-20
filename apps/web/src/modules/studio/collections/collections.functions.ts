import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { openSession } from "../../access/github-auth.server";
import { getCollection, getCollections } from "./collections.server";

/*
 * The bridge between the browser and the collections feature.
 *
 * The same shape as `documents.functions.ts`, for the same reason: a route
 * with a component is in the client bundle, and `collections.server.ts` is
 * deny-listed there by its suffix. What crosses back is definitions, counts
 * and paths - never a body, and never a connection.
 *
 * The session is checked here rather than in the route, because a server
 * function is an HTTP endpoint whether or not a route calls it. A guard in the
 * loader protects the page and not the function under it.
 */

function requireSession(): string {
	const session = openSession(getRequest());
	if (!session) throw new Error("Not signed in.");
	return session.login;
}

/** Every collection with its size, and none of their members. */
export const listStudioCollections = createServerFn({ method: "GET" }).handler(
	async () => {
		requireSession();
		return getCollections();
	},
);

/** One collection, with the first `limit` documents that match it. */
export const readStudioCollection = createServerFn({ method: "GET" })
	.validator((input: unknown) => {
		const { id } = (input ?? {}) as { id?: unknown };
		if (typeof id !== "string" || id.length === 0) {
			throw new Error("A collection id is required.");
		}
		return { id };
	})
	.handler(async ({ data }) => {
		requireSession();
		return getCollection(data.id);
	});
