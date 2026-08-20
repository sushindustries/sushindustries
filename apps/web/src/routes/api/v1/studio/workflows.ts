import { createFileRoute } from "@tanstack/react-router";
import type { Scope } from "../../../../modules/access/access.schemas";
import { openSession } from "../../../../modules/content/github-auth.server";
import { refuse } from "../../../../modules/content/mcp-auth.server";
import { json } from "../../../../modules/registry/registry.server";
import { runWorkflowRequest } from "../../../../modules/studio/workflows/workflows.schemas";
import {
	runWorkflow,
	workflowStatuses,
} from "../../../../modules/studio/workflows/workflows.server";

/*
 * The operations, over HTTP.
 *
 *   GET   what can be run here, and what each one writes
 *   POST  run one
 *
 * This is the endpoint that answers "I want to sync" without a terminal, and
 * it is the one an agent should reach for after making changes through
 * `/api/v1/studio/documents` - a write puts files in the repository and leaves
 * the projection behind, and this is what closes that gap.
 *
 * No PUT and no DELETE, and their absence is meaningful rather than an
 * oversight: a workflow is not a resource. There is nothing at
 * `/workflows/sync` to replace or remove - `sync` is a verb, POST is how a
 * verb is spelled in HTTP, and inventing a resource to hang the other methods
 * off would be a URL shaped like REST describing something that is not.
 *
 * `confirm: true` is required for anything that writes. Same rule as the
 * documents endpoint, same reason: a forgotten field should refuse, never act.
 */

/*
 * A session, or a bearer with the right scope.
 *
 * The scope is a parameter rather than a constant because the two handlers on
 * this route are not the same permission: listing what can be run is reading,
 * and running one spawns a process on the deployment. One guard with one scope
 * would have had to pick, and picking the read one is how a token minted to
 * poll a status ends up able to trigger a sync.
 */
async function guard(request: Request, scope: Scope): Promise<Response | null> {
	if (openSession(request)) return null;
	return refuse(request, scope);
}

export const Route = createFileRoute("/api/v1/studio/workflows")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const refused = await guard(request, "studio:read");
				if (refused) return refused;

				const workflows = workflowStatuses();

				return json({
					total: workflows.length,
					available: workflows.filter((one) => one.available).length,
					workflows,
					usage: {
						run: "POST here with { id, confirm } - confirm must be true for anything whose `writes` is not `nothing`.",
						after:
							"Run `sync` after any write through /api/v1/studio/documents. A write changes files; the index catches up here.",
					},
				});
			},

			POST: async ({ request }) => {
				const refused = await guard(request, "workflows:run");
				if (refused) return refused;

				let body: unknown;
				try {
					body = await request.json();
				} catch {
					return json({ error: "Send JSON." }, { status: 400 });
				}

				const parsed = runWorkflowRequest.safeParse(body);
				if (!parsed.success) {
					return json(
						{ error: "Bad request.", detail: parsed.error.issues },
						{ status: 400 },
					);
				}

				try {
					const run = await runWorkflow(parsed.data);

					/*
					 * 200 for a run that finished, 502 for one that failed.
					 *
					 * Not 500: this endpoint did its job - it started the process and
					 * carried back what the process said. The failure is downstream of
					 * it, which is what 502 means, and the log is in the body either
					 * way because a failed workflow has reported something worth
					 * reading.
					 */
					return json(run, { status: run.ok ? 200 : 502 });
				} catch (error) {
					// A refusal, not a failure: no such workflow, or a write that was
					// not confirmed. Both are the caller's to fix.
					return json(
						{ error: error instanceof Error ? error.message : "Refused." },
						{ status: 400 },
					);
				}
			},
		},
	},
});
