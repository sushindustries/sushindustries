import { z } from "zod";

/*
 * The operations the studio can run, as a table.
 *
 * These are the things that were only ever a terminal command - `pnpm
 * sushindustries sync`, `graphql`, `refs` - and the studio kept telling people
 * to go and run them. That instruction is the tell: a tool that can see the
 * projection is stale and cannot do anything about it is a dashboard, not a
 * studio.
 *
 * So each one is declared here with what it does and what it costs, and one
 * runner executes it. The declaration is the interesting half:
 *
 *   `writes`    whether it changes the database or the repository. It decides
 *               whether the studio asks first, and it is the field an agent
 *               reads before deciding what it may do unattended.
 *   `minutes`   roughly how long, so a caller can set a timeout and a person
 *               can decide whether to wait.
 *   `needsRepo` whether it requires a checkout. Almost all of them do, which
 *               means they do not exist in production - said out loud rather
 *               than discovered from a 500.
 *
 * Nothing here executes. This file is imported by components and by the API
 * route's validator, so it holds descriptions and a schema and no child
 * processes.
 */

export interface Workflow {
	readonly id: string;

	/** The CLI subcommand this runs. The only place the mapping is written. */
	readonly command: string;

	readonly title: string;

	/** What it does, and when you would want it. Two sentences at most. */
	readonly about: string;

	/**
	 * What it changes. `nothing` is safe to run at any time and from anywhere.
	 *
	 * The distinction that matters is not read-versus-write but *what* is
	 * written: `database` is a projection that is rebuilt from files and can be
	 * rebuilt again, `repository` is a commit somebody has to review.
	 */
	readonly writes: "nothing" | "database" | "repository";

	/** Roughly. For choosing a timeout and for setting expectations. */
	readonly minutes: number;

	/** False for the handful that work without a checkout on disk. */
	readonly needsRepo: boolean;
}

export const WORKFLOWS: readonly Workflow[] = [
	{
		id: "sync",
		command: "sync",
		title: "Sync the index",
		about:
			"Rewrites the documents and references tables from the repository, wholesale. Run it after any change the studio made, and whenever the header says the projection is behind.",
		writes: "database",
		minutes: 1,
		needsRepo: true,
	},
	{
		id: "graphql",
		command: "graphql",
		title: "Regenerate the schema",
		about:
			"Writes `apollo/schema.graphql` from the Drizzle tables. Run it after a column changes, so the graph and the database cannot describe different shapes.",
		writes: "repository",
		minutes: 1,
		needsRepo: true,
	},
	{
		id: "refs",
		command: "refs",
		title: "Refresh the reference indexes",
		about:
			"Re-fetches every provider's llms.txt and re-shards it. Slow, network-bound, and the thing to run when a dependency has shipped a release worth reading about.",
		writes: "repository",
		minutes: 6,
		needsRepo: true,
	},
	{
		id: "doctor",
		command: "setup",
		title: "Check the setup",
		about:
			"Reports what this deployment is missing: variables that are unset, credentials that have drifted from what Railway holds. Changes nothing.",
		writes: "nothing",
		minutes: 1,
		needsRepo: true,
	},
];

export const findWorkflow = (id: string) =>
	WORKFLOWS.find((one) => one.id === id);

export const runWorkflowRequest = z.object({
	id: z.string().min(1).max(64),

	/**
	 * Required for anything that writes, and that is the whole guard.
	 *
	 * Not security - the session is - but the difference between an action and
	 * an accident, and the same shape the document actions use: a caller that
	 * forgets a field gets a refusal that names what is missing, never a
	 * rebuild of a production table.
	 */
	confirm: z.boolean().default(false),
});

export type RunWorkflowRequest = z.infer<typeof runWorkflowRequest>;

/** What a run produced. The same shape whether it succeeded or not. */
export interface WorkflowRun {
	readonly id: string;
	readonly ok: boolean;

	/** Wall clock, in milliseconds. Worth reporting because these are slow. */
	readonly took: number;

	/**
	 * Everything the command printed, both streams, in order.
	 *
	 * Capped, and capped for a reason worth stating: `refs` prints a line per
	 * provider and `sync` a line per chunk, so an uncapped log is megabytes of
	 * progress bars crossing the wire to be read by nobody. The last part is
	 * kept rather than the first - a failure says why at the end.
	 */
	readonly log: string;
}
