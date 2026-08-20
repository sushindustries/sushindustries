import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { openSession } from "../../access/github-auth.server";
import type { Page, WriteResult } from "../studio.schemas";
import { writerOptions } from "../writers/writers.server";
import { runDocumentAction } from "./documents.actions.server";
import {
	type DocumentDetail,
	type DocumentRow,
	documentActionRequest,
	documentsQuery,
} from "./documents.schemas";
import {
	getDocument,
	getDocumentFacets,
	getDocuments,
} from "./documents.server";

/*
 * The bridge between the browser and the documents feature.
 *
 * `/studio` has a component, so it is in the client bundle, and every
 * `.server.ts` in this feature is deny-listed there by its suffix. Import
 * protection failed the build the first time a route reached for one, which is
 * the check working rather than an obstacle: a route that can import the write
 * layer is a route that can be persuaded to use it.
 *
 * Three things happen here and nowhere else:
 *
 *   the session is checked      because a check the client can reach is not one
 *   the input is parsed         with the same schema the API route uses
 *   the answer is narrowed      to rows and counts, never a connection or a key
 *
 * The session check being *here* rather than in the route is the load-bearing
 * one. A server function is an HTTP endpoint whether or not a route calls it,
 * so a guard in the loader protects the page and not the function underneath
 * it - which is the version of this that looks correct in a screenshot.
 *
 * `.functions.ts`, so components and loaders may import it statically. Never
 * behind a barrel with a `.server.ts`, which would make one import pull both.
 */

/**
 * Who is asking, or a refusal.
 *
 * Throws rather than returning null, unlike `overview.functions.ts` next door,
 * and the difference is deliberate: that one answers a page that redirects to
 * sign-in, so "not signed in" is an ordinary state there. Everything here is
 * called from a page that has already been through the gate, so an unsigned
 * caller is either a bug or somebody trying it directly.
 */
function requireSession(): string {
	const session = openSession(getRequest());
	if (!session) throw new Error("Not signed in.");
	return session.login;
}

export const listDocuments = createServerFn({ method: "GET" })
	/*
	 * The schema does the validating, not a cast. A validator that hands its
	 * argument back checks nothing once the request has left TypeScript, and
	 * this one builds a SQL ORDER BY out of what it is given - so the column
	 * name has to come from an enum rather than from a caller.
	 */
	.validator((input: unknown) => documentsQuery.parse(input ?? {}))
	.handler(async ({ data }): Promise<Page<DocumentRow>> => {
		requireSession();
		return getDocuments(data);
	});

export const readDocument = createServerFn({ method: "GET" })
	.validator((input: unknown) => {
		const { path } = (input ?? {}) as { path?: unknown };
		if (typeof path !== "string" || path.length === 0) {
			throw new Error("A path is required.");
		}
		return { path };
	})
	.handler(async ({ data }): Promise<DocumentDetail | null> => {
		requireSession();
		return getDocument(data.path);
	});

/**
 * What the filter rail is built from, in one round trip.
 *
 * Both facets together rather than a function each: they are always shown
 * together and always fetched together, and two server functions would be two
 * requests for one panel.
 */
export const readDocumentFilters = createServerFn({ method: "GET" }).handler(
	async () => {
		requireSession();

		const [kinds, sections] = await Promise.all([
			getDocumentFacets("kind"),
			getDocumentFacets("section"),
		]);

		return { kinds, sections, writers: writerOptions() };
	},
);

/**
 * Plans a change, and applies it when told to.
 *
 * POST for both, including the plan. A plan is a read in every sense except
 * the one that matters here: it is the same input, parsed by the same schema,
 * arriving at the same handler, and splitting it into a GET would mean two
 * endpoints where the difference between "describe this" and "do this" is a
 * boolean somebody could get wrong on one of them.
 */
export const applyDocumentAction = createServerFn({ method: "POST" })
	.validator((input: unknown) => documentActionRequest.parse(input ?? {}))
	.handler(async ({ data }): Promise<WriteResult> => {
		requireSession();
		return runDocumentAction(data);
	});
