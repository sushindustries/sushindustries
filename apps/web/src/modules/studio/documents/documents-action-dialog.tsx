import {
	Button,
	DataTable,
	type DataTableColumn,
	Dialog,
	Field,
	Input,
	NativeSelect,
} from "@sushindustries/ui";
import { type ReactNode, useState } from "react";
import type { WriteResult } from "../studio.schemas";
import {
	AUTHORABLE_KINDS,
	type AuthorableKind,
	type DocumentActionRequest,
} from "./documents.schemas";

/*
 * Two steps, in one dialog: what would happen, then whether to do it.
 *
 * The plan is not a courtesy. A slug change is a handful of file moves and an
 * unbounded number of links that stop resolving, and the links are the half
 * that fails quietly - nothing errors, a page just 404s for whoever followed
 * an old address. Showing them before the write is the only moment anybody
 * would look.
 *
 * So the dialog never applies anything on its first press. It asks the server
 * to plan, renders the answer, and the button that commits appears afterwards
 * with the consequences already on screen above it. That is one extra click
 * against the class of mistake nobody notices for a week.
 *
 * `Dialog` supplies the top layer, the focus trap, Escape and the backdrop,
 * because it is a native `<dialog>` underneath. None of that is re-implemented
 * here and none of it should be.
 */

export interface PendingAction {
	readonly action: "create" | "move" | "retitle" | "edit" | "remove";
	readonly request?: DocumentActionRequest;
}

export interface DocumentActionDialogProps {
	readonly pending: PendingAction | null;

	/** The plan, or the result of applying it. Null before the first answer. */
	readonly result: WriteResult | null;

	readonly busy: boolean;
	readonly error: string | null;

	readonly onRun: (request: DocumentActionRequest) => void;
	readonly onClose: () => void;
}

const TITLES: Record<PendingAction["action"], string> = {
	create: "New document",
	move: "Change the slug",
	retitle: "Change the title",
	edit: "Save the document",
	remove: "Remove it",
};

export function DocumentActionDialog({
	pending,
	result,
	busy,
	error,
	onRun,
	onClose,
}: DocumentActionDialogProps): ReactNode {
	/* The create form's own fields. Every other action arrives fully formed. */
	const [kind, setKind] = useState<AuthorableKind>("post");
	const [slug, setSlug] = useState("");
	const [title, setTitle] = useState("");

	if (!pending) return null;

	const creating = pending.action === "create";

	const request: DocumentActionRequest | null = creating
		? {
				action: { action: "create", kind, slug, title: title || undefined },
				apply: false,
			}
		: (pending.request ?? null);

	type Change = { effect: string; path: string; to: string };

	const changes: DataTableColumn<Change>[] = [
		{ id: "effect", header: "Effect" },
		{ id: "path", header: "Path", mono: true },
		{ id: "to", header: "Becomes", mono: true },
	];

	return (
		<Dialog
			open
			onClose={onClose}
			title={TITLES[pending.action]}
			footer={
				<div className="flex items-center gap-2 justify-end">
					<Button variant="ghost" onClick={onClose}>
						{result?.applied ? "Done" : "Cancel"}
					</Button>

					{!result ? (
						<Button
							disabled={busy || !request || (creating && slug.length === 0)}
							onClick={() => request && onRun({ ...request, apply: false })}
						>
							{busy ? "Working…" : "Show me what changes"}
						</Button>
					) : null}

					{/*
					 * Only after a plan, and never for a plan that changes nothing.
					 * A commit button beside an empty change list is a button whose
					 * only possible outcome is confusion.
					 */}
					{result && !result.applied && result.changes.length > 0 ? (
						<Button
							disabled={busy || !request}
							onClick={() => request && onRun({ ...request, apply: true })}
						>
							{busy ? "Writing…" : `Apply via ${result.writer}`}
						</Button>
					) : null}
				</div>
			}
		>
			<div className="flex col gap-4">
				{creating && !result ? (
					<>
						<Field label="Kind">
							<NativeSelect
								value={kind}
								onChange={(event) =>
									setKind(event.target.value as AuthorableKind)
								}
							>
								{AUTHORABLE_KINDS.map((one) => (
									<option key={one} value={one}>
										{one}
									</option>
								))}
							</NativeSelect>
						</Field>

						<Field
							label="Slug"
							hint="Lowercase, digits and single hyphens. It becomes the URL."
						>
							<Input
								value={slug}
								onChange={(event) => setSlug(event.target.value)}
							/>
						</Field>

						<Field label="Title" hint="Left blank, the slug is title-cased.">
							<Input
								value={title}
								onChange={(event) => setTitle(event.target.value)}
							/>
						</Field>
					</>
				) : null}

				{error ? <p className="studio-notice">{error}</p> : null}

				{result ? (
					<div className="flex col gap-4">
						<p>{result.message}</p>

						{result.changes.length > 0 ? (
							<DataTable
								label="Every file this touches"
								rows={result.changes.map((change) => ({
									effect: change.effect,
									path: change.path,
									to: change.to ?? "-",
								}))}
								columns={changes}
							/>
						) : null}

						{/*
						 * The part worth the dialog. Reported rather than repaired: a
						 * rename that silently edited fourteen other files to keep its
						 * links working would be a rename nobody could review, and the
						 * search that found them counts prose as a link too.
						 */}
						{result.breaks.map((broken) => (
							<div key={broken.route} className="flex col gap-2">
								<p className="studio-notice">
									<code>{broken.route}</code> stops answering.{" "}
									{broken.linkedFrom.length === 0
										? "Nothing in the index links to it."
										: `${broken.linkedFrom.length} document${broken.linkedFrom.length === 1 ? "" : "s"} mention it:`}
								</p>
								{broken.linkedFrom.length > 0 ? (
									<ul className="flex col gap-1 mono text-xs">
										{broken.linkedFrom.map((path) => (
											<li key={path}>{path}</li>
										))}
									</ul>
								) : null}
							</div>
						))}

						{result.commit ? (
							<p className="fg-dim mono text-xs">
								commit {result.commit.slice(0, 12)}
							</p>
						) : null}
					</div>
				) : null}
			</div>
		</Dialog>
	);
}
