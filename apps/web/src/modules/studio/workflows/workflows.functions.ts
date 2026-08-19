import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { openSession } from "../../content/github-auth.server";
import { runWorkflowRequest } from "./workflows.schemas";
import { runWorkflow, workflowStatuses } from "./workflows.server";

/*
 * The bridge between the browser and the workflows feature.
 *
 * The session is checked here rather than in the route, because a server
 * function is an HTTP endpoint whether or not a route calls it - and these
 * spawn processes, which is the last thing that should be reachable by anyone
 * who happened to find the URL.
 */

function requireSession(): string {
	const session = openSession(getRequest());
	if (!session) throw new Error("Not signed in.");
	return session.login;
}

/** Every workflow, with whether it can run in this deployment. */
export const listWorkflows = createServerFn({ method: "GET" }).handler(
	async () => {
		requireSession();
		return workflowStatuses();
	},
);

/**
 * Runs one, and returns its log whether it worked or not.
 *
 * POST, because it is the opposite of safe. Anything that writes needs
 * `confirm: true` - not security, but the difference between an action and an
 * accident, which is the same rule the document actions follow.
 */
export const startWorkflow = createServerFn({ method: "POST" })
	.validator((input: unknown) => runWorkflowRequest.parse(input ?? {}))
	.handler(async ({ data }) => {
		requireSession();
		return runWorkflow(data);
	});
