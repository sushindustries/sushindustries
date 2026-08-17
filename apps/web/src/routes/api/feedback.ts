import { pageFeedback } from "@sushindustries/db/schema";
import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod";

/*
 * Page feedback, received as data.
 *
 * A row per vote in Postgres, through the same `@sushindustries/db` the rest
 * of the site uses. The client import stays inside the handler - the suffix
 * convention and Start's import protection both insist - and a missing
 * DATABASE_URL degrades to a log line instead of a 500, because a vote is not
 * worth an error page.
 *
 * What is not negotiable is validation: this is a mutation reachable by
 * anyone, so the body is parsed before anything reads it, and an invalid one
 * is a 400 rather than a row of attacker-shaped text.
 */
const feedbackSchema = z.object({
	page: z.string().min(1).max(200),
	vote: z.enum(["up", "down"]),
});

export const Route = createFileRoute("/api/feedback")({
	server: {
		handlers: {
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
