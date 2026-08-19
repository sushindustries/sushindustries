import type { WriteResult } from "../studio.schemas";
import { writerFor } from "../writers/writers.server";
import { planCreate } from "./actions/create.server";
import { planEdit } from "./actions/edit.server";
import { planMove } from "./actions/move.server";
import { planRemove } from "./actions/remove.server";
import { planRetitle } from "./actions/retitle.server";
import type { DocumentActionRequest } from "./documents.schemas";

/*
 * The documents feature, writing. One entry point, and nothing else.
 *
 * Every structural change goes through `runDocumentAction`. One export rather
 * than five verbs, because the things that must happen *around* a write -
 * parse, plan, check what breaks, pick a writer, report what happened - are
 * the same for all of them, and five exports is five places to leave one out.
 *
 * The planners live in `actions/`, one file each. This file was 497 lines
 * holding all five, which measurement flagged rather than taste: the largest
 * file in the studio and the only one with more than three functions. What is
 * left here is the part that is genuinely shared - the sequence, not the work.
 *
 * The shape of every action is the same:
 *
 *   1. work out which files it touches, from the projection
 *   2. work out what it breaks, from the projection
 *   3. build a batch of writes and deletes
 *   4. hand the batch to a writer, or not, depending on `apply`
 *
 * Step 4 is why a plan and a commit are the same code path. A dry run that
 * takes a different route through the function is a dry run that can disagree
 * with what actually happens, which is the one thing it exists not to do.
 *
 * The projection is read rather than the filesystem, and that is a real trade
 * with a real cost: the projection is as old as the last `sync`, so a file
 * added since is invisible to a plan. It buys the same answer from a laptop
 * and from a container with no checkout, which is what makes the studio work
 * in production at all. `syncedAt` is on every screen for this reason.
 *
 * `.server.ts` because it writes to a repository.
 */

/* ── the one entry point ─────────────────────────────────────────────── */

/**
 * Plans an action, and applies it if asked to.
 *
 * Throws with a sentence rather than returning an error shape. Every caller -
 * the server function, the API route, the graph - already turns a thrown error
 * into its own protocol's failure, and an `ok: false` union would mean each of
 * them handling both. The sentences are written to be shown to a person as
 * they are.
 */
export async function runDocumentAction(
	request: DocumentActionRequest,
): Promise<WriteResult> {
	const writer = writerFor(request.via);
	if (!writer) {
		throw new Error(
			"Nothing here can write. Set GITHUB_WRITE_TOKEN to commit, or STUDIO_LOCAL_WRITES to edit a checkout on this machine.",
		);
	}

	/*
	 * A switch rather than a chain of ternaries.
	 *
	 * It was a chain, and the fifth action is what made it worth changing: at
	 * four it is dense and at five it is a shape you have to count brackets to
	 * read. A switch over the discriminant also narrows the union member by
	 * member, so each planner receives its own action type without a cast -
	 * which the chain achieved only because the last branch happened to be
	 * whatever was left, and stopped being true the moment a case was added
	 * before it.
	 */
	const action = request.action;
	const plan = await (async () => {
		switch (action.action) {
			case "create":
				return planCreate(writer, action);
			case "move":
				return planMove(writer, action);
			case "retitle":
				return planRetitle(writer, action);
			case "edit":
				return planEdit(writer, action);
			case "remove":
				return planRemove(writer, action);
		}
	})();

	if (!request.apply || plan.changes.length === 0) {
		return {
			action: action.action,
			applied: false,
			writer: writer.name,
			changes: plan.changes,
			breaks: plan.breaks,
			commit: null,
			message: plan.message,
		};
	}

	const { commit } = await writer.apply({
		message: plan.commitMessage,
		writes: plan.writes,
		deletes: plan.deletes,
	});

	return {
		action: action.action,
		applied: true,
		writer: writer.name,
		changes: plan.changes,
		breaks: plan.breaks,
		commit,
		/*
		 * The projection is now behind the repository, and saying so is the
		 * honest end of every write. `sync` is what closes the gap, and a studio
		 * that pretended the two were in step would show stale rows with no
		 * explanation for them.
		 */
		message: `${plan.message} Run \`pnpm sushindustries sync\` to bring the index up to date.`,
	};
}
