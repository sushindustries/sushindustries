import { z } from "zod";

/*
 * The vocabulary every studio feature shares, and nothing else.
 *
 * `documents/`, `collections/`, `overview/` and `writers/` are four features
 * that know almost nothing about each other. What they do share is small and
 * load-bearing: what a slug may be, what a repository path may be, what a page
 * of results looks like. That is this file.
 *
 * The discipline worth keeping is what does *not* come here. A schema used by
 * one feature belongs to that feature - moving it up because it might be
 * shared one day is how a shared module becomes the place everything imports
 * from and nothing can be removed. Two features have to actually need it.
 *
 * Zod rather than types, because the difference survives compilation. A type
 * is gone at runtime, so an API route holding a `DocumentQuery` has been told
 * what it hopes it has; everything here parses, so a bad value is a 400 with a
 * sentence rather than a SQL error one layer down.
 *
 * `.schemas.ts`, so it is importable from anywhere - components included.
 */

/**
 * A slug, and what one is allowed to be.
 *
 * Lowercase, digits and single hyphens. Not a general "safe string": this
 * value becomes a directory name, a URL segment and a database key, and the
 * narrowest of the three is what it has to satisfy. It is also the first of
 * two defences for the write layer - a slug that cannot hold a dot or a slash
 * cannot hold `../`.
 */
export const slug = z
	.string()
	.min(1)
	.max(64)
	.regex(
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
		"Lowercase letters, digits and single hyphens.",
	);

/**
 * A repository-relative path.
 *
 * Rejects anything absolute, anything with a `..` segment, and anything with a
 * backslash. That last one is not paranoia on a Unix server: the local writer
 * hands this to `node:path`, and on a machine whose separator is a backslash a
 * rejected `../` and an accepted `..\` are the same escape.
 */
export const repoPath = z
	.string()
	.min(1)
	.max(512)
	.regex(/^[\w.\-/]+$/, "Letters, digits, dots, dashes and forward slashes.")
	.refine((value) => !value.startsWith("/"), "Must be relative to the repo.")
	.refine(
		(value) => !value.split("/").includes(".."),
		"Must not climb out of the repo.",
	);

/**
 * How much of a list to fetch, with the ceiling beside the field.
 *
 * A limit the caller can raise is not a limit. Putting the cap in the schema
 * rather than in each query is what stops a resolver added later from being
 * the one that forgot its own `Math.min`.
 */
export const paging = z.object({
	limit: z.coerce.number().int().min(1).max(200).default(50),
	offset: z.coerce.number().int().min(0).default(0),
});

export type Paging = z.output<typeof paging>;

/**
 * A page of rows, and how many there are in total.
 *
 * `total` costs a second query and earns it: without one the browser can say
 * "50" but not "50 of 1,240", and a list that never says how much it is not
 * showing is a list people trust wrongly.
 */
export interface Page<TRow> {
	readonly rows: readonly TRow[];
	readonly total: number;
	readonly limit: number;
	readonly offset: number;
}

/**
 * What any write did, or would do.
 *
 * The same shape for a plan and for a commit, told apart by `applied`. That is
 * what makes a dry run worth having: the preview and the result render through
 * one component rather than two that drift.
 */
export interface WriteResult {
	/** The action's own name, e.g. `move` or `append-to-collection`. */
	readonly action: string;

	/** False for a plan. True when the files actually moved. */
	readonly applied: boolean;

	/** Which writer did it, or would. `local` on a laptop, `github` in production. */
	readonly writer: string;

	readonly changes: readonly {
		readonly path: string;
		readonly effect: "added" | "changed" | "moved" | "removed";
		readonly to?: string;
	}[];

	/**
	 * Routes that will 404 afterwards, and what links to them.
	 *
	 * The half of a rename nobody remembers. A slug change is a handful of file
	 * moves and an unbounded number of broken links, and the links are the part
	 * that fails silently - which is why they are computed for the plan rather
	 * than discovered in production.
	 */
	readonly breaks: readonly {
		readonly route: string;
		readonly linkedFrom: readonly string[];
	}[];

	/** The commit, when a writer made one. Null for the local writer and for plans. */
	readonly commit: string | null;

	/** One sentence for somebody watching. Past tense applied, conditional planned. */
	readonly message: string;
}
