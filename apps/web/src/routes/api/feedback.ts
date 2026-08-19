import { pageFeedback } from "@sushindustries/db/schema";
import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod";

/*
 * Page feedback, received as data.
 *
 * A row per vote in Postgres, through the same `@sushindustries/db` the rest
 * of the site uses. The client import stays inside the handler - the suffix
 * convention and Start's import protection both insist - and a missing
 * DATABASE_URL degrades to a log line (POST) or an empty list (GET) instead
 * of a 500, because a vote is not worth an error page.
 *
 * What is not negotiable is validation: this is a mutation reachable by
 * anyone, so the body is parsed before anything reads it, and an invalid one
 * is a 400 rather than a row of attacker-shaped text.
 *
 * `id` is optional and client-suppliable: the TanStack DB collection in
 * `feedback-collection.ts` inserts an optimistic row before the server has
 * seen it, and needs the same id back to reconcile rather than double the
 * row on refetch. Omitted, the column's own default still fires - nothing
 * here requires the client to send one.
 */
const feedbackSchema = z.object({
	id: z.string().uuid().optional(),
	page: z.string().min(1).max(200),
	vote: z.enum(["up", "down"]),
});

export const Route = createFileRoute("/api/feedback")({
	server: {
		handlers: {
			/*
			 * Every vote already cast on one page - the sync half of the
			 * collection. Bounded by construction: one doc page accumulates
			 * tens of votes over its life, not the whole table, because the
			 * query is scoped to exactly the page a reader is on.
			 */
			GET: async ({ request }) => {
				const page = new URL(request.url).searchParams.get("page");
				if (!page) {
					return Response.json({ error: "page is required" }, { status: 400 });
				}

				try {
					const { getPageVotes } = await import("@sushindustries/db/client");
					return Response.json(await getPageVotes(page));
				} catch {
					// No database in this environment: an empty page has no votes yet.
					return Response.json([]);
				}
			},

			POST: async ({ request }) => {
				const body: unknown = await request.json().catch(() => null);
				const parsed = feedbackSchema.safeParse(body);

				if (!parsed.success) {
					return new Response(JSON.stringify({ error: "Invalid feedback" }), {
						status: 400,
						headers: { "content-type": "application/json; charset=utf-8" },
					});
				}

				try {
					const { getDb } = await import("@sushindustries/db/client");
					await getDb().insert(pageFeedback).values(parsed.data);
				} catch {
					// No database in this environment: the vote is still worth a line.
					console.info(`[feedback] ${parsed.data.vote} ${parsed.data.page}`);
				}

				return new Response(null, { status: 204 });
			},
		},
	},
});
