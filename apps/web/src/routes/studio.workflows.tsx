import { createFileRoute } from "@tanstack/react-router";
import { WorkflowsPanel } from "../modules/studio/workflows/workflows-panel";
import { workflowsQueryOptions } from "../modules/studio/workflows/workflows-query-keys";

/*
 * Workflows: the operations that used to be terminal commands.
 *
 * The loader prefetches the listing, which is what decides whether each button
 * is pressable - so the panel arrives knowing rather than rendering four
 * disabled buttons that enable a moment later.
 *
 * It never prefetches a *run*. A run is a mutation that spawns a process, and
 * a loader that started one would run it on navigation, on preload-on-hover,
 * and again on every back button.
 */
export const Route = createFileRoute("/studio/workflows")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(workflowsQueryOptions()),
	component: WorkflowsPanel,
	head: () => ({
		meta: [
			{ title: "Workflows · Studio" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});
