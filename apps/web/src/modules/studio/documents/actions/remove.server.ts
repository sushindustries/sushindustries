import { SITE } from "../../../content/site.catalogue";
import type { Writer } from "../../writers/writers.server";
import type { DocumentAction } from "../documents.schemas";
import { getDocumentsBySlug, getDocumentsLinkingTo } from "../documents.server";
import { MOVABLE, type Plan, routeFor } from "./shared.server";

/*
 * Removal, which asks for the name twice.
 *
 * `confirm` must equal the slug. Not security - anybody calling this is
 * already past the session - but the difference between an action and an
 * accident, and the one thing a menu item cannot express on its own.
 *
 * It refuses the same kinds `move` refuses, for a sharper reason: deleting a
 * component's prose leaves the code with nothing describing it, which is worse
 * than leaving both, because the code still compiles and nothing says why it
 * is undocumented.
 */

export async function planRemove(
	_writer: Writer,
	action: Extract<DocumentAction, { action: "remove" }>,
): Promise<Plan> {
	if (action.confirm !== action.slug) {
		throw new Error(
			"Type the slug again to confirm. This is the one action nothing undoes for you.",
		);
	}

	if (!MOVABLE.has(action.kind)) {
		throw new Error(
			`A ${action.kind} is more than its documents, and deleting only the prose would leave the code with nothing describing it. Remove it deliberately, in an editor, where the compiler can tell you what broke.`,
		);
	}

	const found = await getDocumentsBySlug(action.kind, action.slug);
	if (found.length === 0)
		throw new Error(`No ${action.kind} called ${action.slug}.`);

	const old = routeFor(action.kind, action.slug);

	return {
		changes: found.map((document) => ({
			path: document.path,
			effect: "removed" as const,
		})),
		breaks: old
			? [{ route: old, linkedFrom: await getDocumentsLinkingTo(old) }]
			: [],
		writes: [],
		deletes: found.map((document) => document.path),
		message: `Removes ${found.length} file${found.length === 1 ? "" : "s"}, and ${SITE.url}${old ?? ""} with them.`,
		commitMessage: `chore(${action.kind}): remove ${action.slug}`,
	};
}
