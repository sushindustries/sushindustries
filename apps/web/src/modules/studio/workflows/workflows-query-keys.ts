import { queryOptions } from "@tanstack/react-query";
import { RUNTIME, rootFor } from "../studio.cache";
import { listWorkflows } from "./workflows.functions";

/*
 * The workflow listing's key.
 *
 * There is no key for a *run*, deliberately. A run is a mutation with a log,
 * not a cached resource - keying it would mean a second press showing the
 * first press's output from cache, which for something that spawns a process
 * is the wrong answer in the most confusing possible way.
 */
export const workflowKeys = {
	all: rootFor(RUNTIME, "workflows"),
	list: () => [...workflowKeys.all, "list"] as const,
};

export const workflowsQueryOptions = () =>
	queryOptions({
		queryKey: workflowKeys.list(),
		queryFn: () => listWorkflows(),
		/*
		 * Effectively static: whether a workflow can run depends on whether
		 * there is a checkout, which does not change while the server is up.
		 */
		staleTime: 60 * 60_000,
	});
