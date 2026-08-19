import type { Writer } from "../../writers/writers.server";
import type { DocumentAction } from "../documents.schemas";
import { type Plan, setFrontmatter } from "./shared.server";

/*
 * The frontmatter, and only the frontmatter.
 *
 * Separate from `edit`, which replaces the whole file, and the difference is
 * what the diff looks like: this rewrites one line and leaves every other byte
 * alone, so a title change reviews as a title change. One action for both
 * would make every retitle look like a rewrite.
 */

export async function planRetitle(
	writer: Writer,
	action: Extract<DocumentAction, { action: "retitle" }>,
): Promise<Plan> {
	const text = await writer.read(action.path);
	if (text === null) throw new Error(`No file at ${action.path}.`);

	const next = setFrontmatter(text, {
		title: action.title,
		summary: action.summary,
	});

	if (next === text) {
		return {
			changes: [],
			breaks: [],
			writes: [],
			deletes: [],
			message: "Nothing to change - it already says that.",
			commitMessage: "",
		};
	}

	return {
		changes: [{ path: action.path, effect: "changed" }],
		breaks: [],
		writes: [{ path: action.path, text: next }],
		deletes: [],
		message: `Rewrites the frontmatter of ${action.path}.`,
		commitMessage: `docs: retitle ${action.path}`,
	};
}
