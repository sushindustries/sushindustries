import type { WriteResult } from "../../studio.schemas";
import type { Writer } from "../../writers/writers.server";
import type { DocumentAction } from "../documents.schemas";
import { getDocumentsBySlug, getDocumentsLinkingTo } from "../documents.server";
import { MOVABLE, type Plan, routeFor } from "./shared.server";

/*
 * The slug change, which is the action with consequences it cannot fix.
 *
 * Moving files is the easy half and the whole of what most tools do. The half
 * that matters is that a route stops answering, and every link to it - in
 * prose, in a nav, in somebody's bookmark - stops resolving with no error
 * anywhere. So the plan computes those links before the write, and the dialog
 * shows them above the button that commits.
 *
 * Reported rather than repaired. Rewriting every linking document to point at
 * the new name is the helpful-looking version and is wrong: a link inside a
 * code fence, inside a quotation, or in a sentence *about* the old name would
 * be rewritten too, and a rename that silently edits fourteen other files is a
 * rename nobody can review.
 */

export async function planMove(
	writer: Writer,
	action: Extract<DocumentAction, { action: "move" }>,
): Promise<Plan> {
	if (!MOVABLE.has(action.kind)) {
		throw new Error(
			`A ${action.kind} is more than its documents - a source file, a registry entry, a workspace member and every import of it - and moving only the prose would leave the code at the old name. Scaffold the new one with \`pnpm new ${action.kind} ${action.to}\` and remove the old one deliberately.`,
		);
	}

	const found = await getDocumentsBySlug(action.kind, action.from);
	if (found.length === 0) {
		throw new Error(`No ${action.kind} called ${action.from}.`);
	}

	const clash = await getDocumentsBySlug(action.kind, action.to);
	if (clash.length > 0) {
		throw new Error(`There is already a ${action.kind} called ${action.to}.`);
	}

	const writes: { path: string; text: string }[] = [];
	const deletes: string[] = [];
	/*
	 * Mutable here, readonly in the result. `WriteResult["changes"]` is a
	 * readonly array because nothing downstream may edit a plan, and the place
	 * it is *built* is the one place that has to - so the element type is
	 * borrowed and the array is not.
	 */
	const changes: WriteResult["changes"][number][] = [];

	for (const document of found) {
		const to = document.path.replaceAll(action.from, action.to);
		const text = await writer.read(document.path);
		if (text === null) {
			throw new Error(
				`${document.path} is in the index but not in the repository. Run \`pnpm sushindustries sync\` and try again.`,
			);
		}

		writes.push({ path: to, text });
		deletes.push(document.path);
		changes.push({ path: document.path, effect: "moved", to });
	}

	/*
	 * What the old route was, and who pointed at it.
	 *
	 * Reported rather than rewritten. Editing every linking document to point
	 * at the new name would be the helpful version and is the wrong call here:
	 * a link inside a code fence, inside a quotation, or in a sentence about
	 * the old name would be rewritten too, and a rename that silently edits
	 * fourteen other files is a rename nobody can review.
	 */
	const old = routeFor(action.kind, action.from);
	const breaks = old
		? [{ route: old, linkedFrom: await getDocumentsLinkingTo(old) }]
		: [];

	return {
		changes,
		breaks,
		writes,
		deletes,
		message: `Moves ${found.length} file${found.length === 1 ? "" : "s"} from ${action.from} to ${action.to}.`,
		commitMessage: `refactor(${action.kind}): rename ${action.from} to ${action.to}`,
	};
}
