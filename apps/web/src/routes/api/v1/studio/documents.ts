import { createFileRoute } from "@tanstack/react-router";
import type { Scope } from "../../../../modules/access/access.schemas";
import { openSession } from "../../../../modules/content/github-auth.server";
import { refuse } from "../../../../modules/content/mcp-auth.server";
import { json } from "../../../../modules/registry/registry.server";
import { runDocumentAction } from "../../../../modules/studio/documents/documents.actions.server";
import {
	documentActionRequest,
	documentsQuery,
} from "../../../../modules/studio/documents/documents.schemas";
import { getDocuments } from "../../../../modules/studio/documents/documents.server";

/*
 * The documents collection, over HTTP, with the verbs meaning what they mean.
 *
 *   GET     the collection, filtered and paged
 *   POST    create one from a template
 *   PUT     change what one is called - its title, its summary, its slug
 *   PATCH   replace what one says - the whole file, against the sha you read
 *   DELETE  remove one
 *
 * The verb is not decoration. Everything under `/api/v1` before this was read
 * only, so `GET` was the whole API and the shape never had to be decided; the
 * moment there is a write, using one POST with an `action` field in the body
 * would mean a cache, a proxy and a browser all being told that a rename and a
 * search are the same kind of request. They are not: `GET` is safe and
 * cacheable, `PUT` is idempotent - renaming to the same name twice is the same
 * end state - and `DELETE` is neither. Saying so in the method is free, and it
 * is what makes this an API rather than an RPC endpoint wearing a URL.
 *
 * Underneath, all four call the same action layer the studio's own server
 * functions call. There is one write path into this repository and this is a
 * second door onto it, not a second implementation - which is the property
 * that keeps an agent's `PUT` and a person's click from behaving differently.
 *
 * Auth: a session or the bearer token. A script has no browser to sign in
 * with, and the studio has no token to hold.
 *
 * `?apply=true` is required to write. Without it every method plans and
 * changes nothing, which is the same default the studio uses and for the same
 * reason: a forgotten field should describe a rename, not perform one.
 */

/**
 * A session, or a bearer with the right scope, or a refusal to hand back.
 *
 * The scope is a parameter because reading this endpoint and writing through it
 * are different permissions over the same URL: a GET lists documents, and a
 * POST with `?apply=true` puts a file in the repository. A single scope for
 * both would mean any token that can search the index can also rewrite a post.
 */
async function guard(request: Request, scope: Scope): Promise<Response | null> {
	if (openSession(request)) return null;
	return refuse(request, scope);
}

/** `?apply=true`. Anything else, including absent, is a dry run. */
const wantsApply = (request: Request) =>
	new URL(request.url).searchParams.get("apply") === "true";

/**
 * Runs an action and turns a thrown sentence into a 400.
 *
 * The action layer throws with a message written to be read by a person - "no
 * post called x", "type the slug again to confirm" - so the handler's job is
 * to carry it across rather than to replace it with "Bad Request". A 500 for a
 * mistyped slug would be this endpoint blaming itself for the caller.
 */
async function run(body: unknown, apply: boolean): Promise<Response> {
	const parsed = documentActionRequest.safeParse({
		...(body as object),
		apply,
	});

	if (!parsed.success) {
		return json(
			{ error: "That is not a valid action.", detail: parsed.error.issues },
			{ status: 400 },
		);
	}

	try {
		const result = await runDocumentAction(parsed.data);
		return json(result, { status: result.applied ? 200 : 202 });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : "Refused." },
			{ status: 400 },
		);
	}
}

/** The body, or null when it is not JSON. Never a throw out of a handler. */
async function readBody(
	request: Request,
): Promise<Record<string, unknown> | null> {
	try {
		return (await request.json()) as Record<string, unknown>;
	} catch {
		return null;
	}
}

export const Route = createFileRoute("/api/v1/studio/documents")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const refused = await guard(request, "studio:read");
				if (refused) return refused;

				/*
				 * The query string, parsed by the same schema the server function
				 * uses. `coerce` on the numbers is what makes that possible: a
				 * search param is always a string, and one schema that accepts both
				 * is one definition of what a page of documents is.
				 */
				const params = Object.fromEntries(new URL(request.url).searchParams);
				const parsed = documentsQuery.safeParse(params);

				if (!parsed.success) {
					return json(
						{ error: "Bad query.", detail: parsed.error.issues },
						{ status: 400 },
					);
				}

				const page = await getDocuments(parsed.data);

				return json({
					...page,
					/*
					 * The next page as a URL rather than as a number the caller has
					 * to assemble. An API that makes every client reimplement its own
					 * paging is an API with as many paging bugs as it has clients.
					 */
					next:
						page.offset + page.limit < page.total
							? `/api/v1/studio/documents?${new URLSearchParams({
									...params,
									offset: String(page.offset + page.limit),
								})}`
							: null,
				});
			},

			POST: async ({ request }) => {
				const refused = await guard(request, "documents:write");
				if (refused) return refused;

				const body = await readBody(request);
				if (!body) return json({ error: "Send JSON." }, { status: 400 });

				return run(
					{ action: { action: "create", ...body } },
					wantsApply(request),
				);
			},

			/*
			 * PUT, because the two things it does are both idempotent: setting a
			 * title to a value it already has changes nothing, and moving a slug to
			 * where it already is is refused rather than repeated. PATCH would be
			 * defensible for the title alone and wrong for the move, and one method
			 * that is right for both is better than two that split by field.
			 *
			 * Which of the two happens is decided by the body: `slug` moves it,
			 * `title` or `summary` rewrites the frontmatter. Both at once is
			 * refused, because they are two commits and the caller should say which
			 * order they want them in.
			 */
			PUT: async ({ request }) => {
				const refused = await guard(request, "documents:write");
				if (refused) return refused;

				const body = await readBody(request);
				if (!body) return json({ error: "Send JSON." }, { status: 400 });

				const moving = typeof body.slug === "string";
				const retitling =
					typeof body.title === "string" || typeof body.summary === "string";

				if (moving && retitling) {
					return json(
						{
							error:
								"A rename and a retitle are two commits. Send them one at a time, in the order you want them in.",
						},
						{ status: 400 },
					);
				}

				if (moving) {
					return run(
						{
							action: {
								action: "move",
								kind: body.kind,
								from: body.from,
								to: body.slug,
							},
						},
						wantsApply(request),
					);
				}

				return run(
					{
						action: {
							action: "retitle",
							path: body.path,
							title: body.title,
							summary: body.summary,
						},
					},
					wantsApply(request),
				);
			},

			/*
			 * PATCH replaces the document's text, and PUT does not.
			 *
			 * They are split by what they replace rather than by how much. PUT
			 * sets named fields - a title, a summary, a slug - and is idempotent
			 * on each; PATCH sends the whole file and carries the `sha` it started
			 * from, so a second send of the same body against a moved file is
			 * *refused* rather than repeated. That conditional refusal is the
			 * behaviour, and it is not what PUT means.
			 *
			 * `sha` is optional and should not be. It is optional because a script
			 * generating a file from scratch has no version to have started from,
			 * and sending one it invented would be worse than sending none. Any
			 * client that read the document first has one and should send it.
			 */
			PATCH: async ({ request }) => {
				const refused = await guard(request, "documents:write");
				if (refused) return refused;

				const body = await readBody(request);
				if (!body) return json({ error: "Send JSON." }, { status: 400 });

				return run(
					{
						action: {
							action: "edit",
							path: body.path,
							body: body.body,
							sha: body.sha,
						},
					},
					wantsApply(request),
				);
			},

			DELETE: async ({ request }) => {
				const refused = await guard(request, "documents:write");
				if (refused) return refused;

				const body = await readBody(request);
				if (!body) return json({ error: "Send JSON." }, { status: 400 });

				return run(
					{ action: { action: "remove", ...body } },
					wantsApply(request),
				);
			},
		},
	},
});
