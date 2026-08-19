import type { Writer } from "../../writers/writers.server";
import type { DocumentAction } from "../documents.schemas";
import { getDocument as getDocumentByPath } from "../documents.server";
import { type Plan, sha256 } from "./shared.server";

/*
 * The whole document, replaced - the one action that writes arbitrary bytes.
 *
 * Bounded rather than open, and the bound is the whole safety argument: the
 * path has to already be a document in the index, so the worst a caller can do
 * is rewrite a file this repository put there. What it deliberately cannot do
 * is create a file at a path of its choosing; that is `create`, and `create`
 * only ever writes a template to a path a template decides.
 *
 * The `sha` check is the other half. An editor sends the version it opened
 * with, and a write against a file that has moved since is refused - which is
 * the only protection an editor over a git repository can offer, and without
 * it the second save silently discards the first.
 */

/**
 * The whole document, replaced.
 *
 * Two guards, and both matter. The path has to be a document the projection
 * knows about, so this cannot create a file somewhere of the caller's
 * choosing - that is `create`, and `create` only writes templates to paths a
 * template decides. And the `sha` the editor started from has to still be the
 * `sha` on disk, so a save cannot land on top of a change nobody has seen.
 *
 * The sha check compares against the *file*, not against the projection. The
 * projection is as old as the last sync and would happily agree with an editor
 * that is also out of date, which is exactly the case the check exists for.
 */
export async function planEdit(
	writer: Writer,
	action: Extract<DocumentAction, { action: "edit" }>,
): Promise<Plan> {
	const known = await getDocumentByPath(action.path);
	if (!known) {
		throw new Error(
			`${action.path} is not a document in the index. Create it with \`create\` - this only rewrites what already exists.`,
		);
	}

	const current = await writer.read(action.path);
	if (current === null) {
		throw new Error(
			`${action.path} is in the index but not in the repository. Run \`pnpm sushindustries sync\` and try again.`,
		);
	}

	if (action.sha && sha256(current) !== action.sha) {
		throw new Error(
			"That file has changed since this editor opened it. Reload before saving, or the change you cannot see is the one that disappears.",
		);
	}

	if (current === action.body) {
		return {
			changes: [],
			breaks: [],
			writes: [],
			deletes: [],
			message: "Nothing to change - it already says that.",
			commitMessage: "",
		};
	}

	/*
	 * How much moved, in lines. A byte count is a number nobody can picture,
	 * and "changed 3 lines" against "changed 240" is the difference between a
	 * typo fix and a rewrite - which is the thing worth knowing before pressing
	 * apply.
	 */
	const before = current.split("\n");
	const after = action.body.split("\n");
	const touched =
		Math.abs(before.length - after.length) +
		before.filter((line, at) => at < after.length && line !== after[at]).length;

	return {
		changes: [{ path: action.path, effect: "changed" }],
		breaks: [],
		writes: [{ path: action.path, text: action.body }],
		deletes: [],
		message: `Rewrites ${action.path}. ${touched} line${touched === 1 ? "" : "s"} differ.`,
		commitMessage: `docs: edit ${action.path}`,
	};
}
