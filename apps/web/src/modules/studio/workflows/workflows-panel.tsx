import {
	Badge,
	Button,
	CodeBlock,
	Dialog,
	Icon,
	type IconName,
	Progress,
	Workbench,
} from "@sushindustries/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { PROJECTION, REPOSITORY } from "../studio.cache";
import { startWorkflow } from "./workflows.functions";
import type { WorkflowRun } from "./workflows.schemas";
import { workflowsQueryOptions } from "./workflows-query-keys";

/*
 * The workflows, as buttons that ask first.
 *
 * These were terminal commands, and the studio's answer to a stale projection
 * was a sentence telling you to go and run one. That sentence is the tell: a
 * tool that can see a problem and cannot act on it is a dashboard.
 *
 * Anything that writes goes through a dialog naming what it writes to, because
 * the three of them are not equally reversible - `sync` rebuilds a projection
 * from files and can be run again, `refs` fetches thirty-five documents over
 * the network and takes six minutes, `graphql` changes a checked-in file. The
 * dialog says which, and the button says the same word the confirmation did.
 *
 * The log is shown whether the run worked or not, and that is the whole point
 * of the panel over a spinner: a workflow that failed has *reported* something,
 * and hiding it behind "something went wrong" throws away the only useful part.
 */

const TONE: Record<string, string> = {
	nothing: "layout",
	database: "content",
	repository: "motion",
};

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

/**
 * A glyph per workflow, so the four are told apart before they are read.
 *
 * Keyed by id rather than carried in `WORKFLOWS`, because an icon is a fact
 * about how this panel draws them and not about what they do - the API lists
 * the same four and has no use for a glyph name.
 */
const ICONS: Record<string, IconName> = {
	sync: "spark",
	graphql: "layers",
	refs: "download",
	doctor: "check",
};

export function WorkflowsPanel(): ReactNode {
	const client = useQueryClient();
	const workflows = useQuery(workflowsQueryOptions());

	const [pending, setPending] = useState<string | null>(null);
	const [result, setResult] = useState<WorkflowRun | null>(null);

	/*
	 * One at a time, by scope. These spawn processes against one checkout, and
	 * two syncs running at once would be two transactions truncating the same
	 * tables - the second would win, having done the same work twice.
	 */
	const start = useMutation({
		scope: REPOSITORY,
		mutationFn: (id: string) => startWorkflow({ data: { id, confirm: true } }),
		onSuccess: (run) => {
			setResult(run);
			setPending(null);

			/*
			 * A successful sync rewrote the whole projection, so everything drawn
			 * from it is now the old copy - the documents, the collections whose
			 * membership is a query over them, every insight computed from them,
			 * and the counts in the hub and the header.
			 *
			 * Invalidating the origin rather than each feature is what makes that
			 * true rather than merely intended. This invalidated the documents
			 * alone, and the other four went on serving pre-sync numbers under a
			 * header reporting the sync had finished. A section added under
			 * `PROJECTION` tomorrow is refreshed by this line untouched.
			 */
			if (run.ok && run.id === "sync") {
				client.invalidateQueries({ queryKey: PROJECTION });
			}
		},
	});

	const all = workflows.data ?? [];
	const chosen = all.find((one) => one.id === pending);

	return (
		<>
			<Workbench
				title="workflows"
				label="Operations this studio can run"
				status={
					<>
						<span className="workbench-stat">
							<b>{all.filter((one) => one.available).length}</b> of{" "}
							<b>{all.length}</b> available here
						</span>
						{start.isPending ? (
							<span className="workbench-stat">running…</span>
						) : null}
					</>
				}
			>
				<div className="flex col gap-4">
					{all.map((workflow) => (
						<section key={workflow.id} className="studio-panel flex col gap-3">
							<div className="flex items-center gap-3 wrap">
								<h3 className="m-0 flex-1 flex items-center gap-2">
									<Icon name={ICONS[workflow.id] ?? "terminal"} />
									{workflow.title}
								</h3>
								<Badge tone={TONE[workflow.writes]}>
									writes {workflow.writes}
								</Badge>
								<Badge>~{workflow.minutes} min</Badge>
							</div>

							<p className="fg-dim m-0">{workflow.about}</p>

							<div className="flex items-center gap-3 wrap">
								<Button
									disabled={!workflow.available || start.isPending}
									onClick={() => {
										setResult(null);
										start.reset();
										/*
										 * Anything that writes asks first; anything that does
										 * not runs on the press. A confirmation for a read is
										 * a dialog that teaches people to dismiss dialogs.
										 */
										if (workflow.writes === "nothing") {
											start.mutate(workflow.id);
											return;
										}
										setPending(workflow.id);
									}}
								>
									<Icon name={ICONS[workflow.id] ?? "play"} />
									{start.isPending && start.variables === workflow.id
										? "Running…"
										: "Run"}
								</Button>

								<span className="fg-faint text-xs mono">{workflow.reason}</span>
							</div>

							{/*
							 * Indeterminate, because it is the honest bar to draw.
							 *
							 * The CLI prints progress to a stream this cannot read until
							 * the process exits, so there is no percentage to show - and a
							 * bar animating from 0 to 90 on a timer is a bar that lies
							 * about what it knows. `Progress` with no `value` is the
							 * platform's own indeterminate state, which says "working"
							 * and claims nothing else.
							 */}
							{start.isPending && start.variables === workflow.id ? (
								<Progress
									label={`${workflow.title} - about ${workflow.minutes} minute${workflow.minutes === 1 ? "" : "s"}`}
								/>
							) : null}

							{result?.id === workflow.id ? (
								<div className="flex col gap-2">
									<p className="m-0 text-sm">
										{result.ok ? "Finished" : "Failed"} in{" "}
										{seconds(result.took)}.
									</p>
									{/*
									 * The log, shown either way. A workflow that failed has
									 * reported something, and "something went wrong" throws
									 * away the only part worth reading.
									 */}
									<CodeBlock
										code={result.log || "(no output)"}
										language="text"
									/>
								</div>
							) : null}
						</section>
					))}

					{all.length === 0 && !workflows.isPending ? (
						<p className="fg-dim">Nothing to run here.</p>
					) : null}
				</div>
			</Workbench>

			<Dialog
				open={Boolean(chosen)}
				onClose={() => setPending(null)}
				title={chosen ? `Run ${chosen.title.toLowerCase()}?` : ""}
				footer={
					<div className="flex items-center gap-2 justify-end">
						<Button variant="ghost" onClick={() => setPending(null)}>
							Cancel
						</Button>
						<Button
							disabled={start.isPending}
							onClick={() => chosen && start.mutate(chosen.id)}
						>
							{start.isPending ? "Running…" : "Run it"}
						</Button>
					</div>
				}
			>
				{chosen ? (
					<div className="flex col gap-3">
						<p className="m-0">{chosen.about}</p>
						<p className="studio-notice m-0">
							This writes to the <b>{chosen.writes}</b> and takes about{" "}
							{chosen.minutes} minute{chosen.minutes === 1 ? "" : "s"}.{" "}
							{chosen.writes === "repository"
								? "It commits to the studio branch, which runs no CI and deploys nothing."
								: "It rewrites the projection wholesale from the files, so it can be run again safely."}
						</p>
					</div>
				) : null}
			</Dialog>
		</>
	);
}
