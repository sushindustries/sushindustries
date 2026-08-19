import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { localRoot } from "../writers/writers.server";
import {
	findWorkflow,
	type RunWorkflowRequest,
	WORKFLOWS,
	type Workflow,
	type WorkflowRun,
} from "./workflows.schemas";

/*
 * Running a workflow, which means running the CLI.
 *
 * It shells out rather than importing the command, and that is the decision
 * worth defending. `packages/cli` is plain ESM built to run on a bare
 * `pnpm install` with no build step; importing `sync()` into a Vite-bundled
 * server would drag its `node:` imports, its spinner and its process-exit
 * behaviour into a request handler - and `process.exit` inside a route is a
 * deployment that dies when somebody presses a button.
 *
 * A child process has none of that. It gets its own exit code, its own stdio,
 * and its failure is a non-zero status rather than a torn-down server.
 *
 * The cost is that it needs a checkout, which production does not have. That
 * is reported rather than hidden - `available` is on every workflow the studio
 * lists, so "this cannot run here" is on screen before anybody presses it.
 *
 * `.server.ts` because it spawns processes.
 */

const run = promisify(execFile);

/** The last of the output, which is where a failure explains itself. */
const LOG_LIMIT = 8_000;

/** Generous. `refs` fetches thirty-five documents over the network. */
const timeoutFor = (workflow: Workflow) => workflow.minutes * 60_000 + 30_000;

/**
 * Where the CLI's entry point is, or null.
 *
 * Checked rather than assumed, because "the repository is on disk" and "the
 * CLI is in it" are different facts: a shallow checkout, a Docker layer with
 * only `apps/`, or a workspace that has not been installed all satisfy the
 * first and fail the second.
 */
function entryPoint(): string | null {
	const root = localRoot();
	if (!root) return null;

	const entry = join(root, "packages/cli/adam-jurek.mjs");
	return existsSync(entry) ? entry : null;
}

export interface WorkflowStatus extends Workflow {
	readonly available: boolean;

	/** Why not, when it is not. One sentence, shown as-is. */
	readonly reason: string;
}

/**
 * Every workflow, with whether it can run here.
 *
 * Reported for all of them rather than filtered, because a workflow that
 * exists and cannot run is information - it is what tells somebody looking at
 * a stale projection in production that the fix is a terminal on a machine
 * with a checkout, rather than a button that is missing for no reason.
 */
export function workflowStatuses(): readonly WorkflowStatus[] {
	const entry = entryPoint();

	return WORKFLOWS.map((workflow) => ({
		...workflow,
		available: !workflow.needsRepo || Boolean(entry),
		reason: entry
			? `Runs \`pnpm sushindustries ${workflow.command}\`.`
			: "No repository on this machine - the deployed image has no checkout. Run it where the code is.",
	}));
}

/**
 * Runs one workflow and reports what happened.
 *
 * Never throws for a failed command. A workflow that exits non-zero has
 * *reported* something - a missing variable, a provider that would not answer -
 * and turning that into a 500 loses the log, which is the entire value. It
 * throws only for the two things that are the caller's fault: no such
 * workflow, and a write that was not confirmed.
 */
export async function runWorkflow(
	request: RunWorkflowRequest,
): Promise<WorkflowRun> {
	const workflow = findWorkflow(request.id);
	if (!workflow) throw new Error(`No workflow called "${request.id}".`);

	if (workflow.writes !== "nothing" && !request.confirm) {
		throw new Error(
			`"${workflow.title}" writes to the ${workflow.writes}. Send confirm: true to run it.`,
		);
	}

	const entry = entryPoint();
	if (!entry) {
		throw new Error(
			"No repository on this machine, so there is no CLI to run. This works where the code is checked out.",
		);
	}

	const started = Date.now();

	try {
		const { stdout, stderr } = await run("node", [entry, workflow.command], {
			cwd: localRoot() ?? undefined,
			timeout: timeoutFor(workflow),
			// The CLI prints progress; a small buffer truncates mid-run and the
			// promise rejects with ENOBUFS, which reads like the command failed.
			maxBuffer: 16 * 1024 * 1024,
			env: process.env,
		});

		return {
			id: workflow.id,
			ok: true,
			took: Date.now() - started,
			log: `${stdout}${stderr}`.slice(-LOG_LIMIT),
		};
	} catch (error) {
		const shaped = error as {
			stdout?: string;
			stderr?: string;
			message?: string;
		};

		return {
			id: workflow.id,
			ok: false,
			took: Date.now() - started,
			log: (
				`${shaped.stdout ?? ""}${shaped.stderr ?? ""}` ||
				(shaped.message ?? "")
			).slice(-LOG_LIMIT),
		};
	}
}
