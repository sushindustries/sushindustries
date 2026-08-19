import {
	Button,
	DropdownMenu,
	Field,
	Input,
	MarkdownView,
	Textarea,
} from "@sushindustries/ui";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
/*
 * The repository this studio maintains, for the "open on GitHub" link.
 *
 * Read from the one module that already knows it rather than typed here.
 * `content/repo.ts` is client-safe and is what the star button, the doc
 * actions and the graph all read - a second copy of the slug would be a second
 * thing to change when the remote moves.
 */
import { REPO_SLUG as GITHUB_SLUG } from "../../content/repo";
import type { WriteResult } from "../studio.schemas";
import type { DocumentActionRequest } from "./documents.schemas";
import { documentQueryOptions } from "./documents-query-keys";

/*
 * One document, read and edited.
 *
 * Two panes of the same thing rather than two modes of the studio: the
 * rendered document is what it says, the form beside it is what it is called.
 * Keeping them together is the whole reason this is worth building - the
 * failure a CMS exists to prevent is a title changed against the wrong page,
 * and that is impossible when the page is on screen while you type it.
 *
 * The edit surface is deliberately small: title, summary, slug, and removal.
 * There is no body editor and there should not be one. A textarea over a
 * Markdown file that is checked into git, reviewed in pull requests and
 * rendered through a block dispatcher is a worse editor than the one everybody
 * already has open, and it would be the only write path here that could not be
 * described as a structural change. Prose belongs in an editor; *structure*
 * belongs here.
 *
 * Everything it can do produces a plan first. The dialog shows what would
 * change, including what would break, and only then offers to apply it.
 */

export interface DocumentViewerProps {
	readonly path: string;

	/** Opens the confirm dialog for an action against this document. */
	readonly onAction: (request: DocumentActionRequest) => void;

	/** The last result, when it was about this document. */
	readonly result: WriteResult | null;
}

export function DocumentViewer({
	path,
	onAction,
	result,
}: DocumentViewerProps): ReactNode {
	const document = useQuery(documentQueryOptions(path));

	/*
	 * The form is uncontrolled until it is touched.
	 *
	 * `undefined` means "whatever the document says", a string means "what
	 * somebody typed". Seeding state from the query instead would need an
	 * effect to re-seed it when the selection changes, and that effect is the
	 * usual way a form ends up showing the previous document's title.
	 */
	const [title, setTitle] = useState<string | undefined>();
	const [summary, setSummary] = useState<string | undefined>();
	const [slug, setSlug] = useState<string | undefined>();

	if (document.isPending) {
		return <p className="fg-dim">Reading {path}…</p>;
	}

	const found = document.data;
	if (!found) {
		return (
			<p className="fg-dim">
				Nothing at <code>{path}</code>. The index may be behind the repository -
				run <code>pnpm sushindustries sync</code>.
			</p>
		);
	}

	const currentTitle = title ?? found.title ?? "";
	const currentSummary = summary ?? found.summary ?? "";
	const currentSlug = slug ?? found.slug ?? "";

	const retitled =
		currentTitle !== (found.title ?? "") ||
		currentSummary !== (found.summary ?? "");
	const moved = Boolean(found.slug) && currentSlug !== found.slug;

	return (
		<div className="flex col gap-5">
			<header className="flex col gap-2">
				<div className="flex items-center gap-3 wrap">
					<h2 className="flex-1">{found.title ?? found.path}</h2>

					<DropdownMenu
						label="Maintenance"
						icon="terminal"
						align="end"
						items={[
							{
								id: "view",
								label: "Open on the site",
								icon: "link",
								disabled: !found.route,
							},
							{
								id: "source",
								label: "Open on GitHub",
								icon: "github",
							},
							{
								id: "remove",
								label: "Remove…",
								icon: "close",
								destructive: true,
								// Only the kinds a delete can honestly complete. A
								// component is a source file, a registry entry and every
								// import of it, and removing its prose alone would leave
								// the code with nothing describing it.
								disabled: !["post", "page", "desk"].includes(found.kind),
							},
						]}
						onSelect={(id) => {
							if (id === "view" && found.route) {
								window.open(found.route, "_blank", "noopener");
								return;
							}
							if (id === "source") {
								window.open(
									`https://github.com/${GITHUB_SLUG}/blob/main/${found.path}`,
									"_blank",
									"noopener",
								);
								return;
							}
							onAction({
								action: {
									action: "remove",
									kind: found.kind as "post",
									slug: found.slug ?? "",
									confirm: found.slug ?? "",
								},
								apply: false,
							});
						}}
					/>
				</div>

				<p className="mono text-xs fg-dim">{found.path}</p>
			</header>

			{/* ── what it is called ─────────────────────────────────────── */}

			<section className="flex col gap-3 studio-panel">
				<h3>Structure</h3>

				<Field
					label="Title"
					hint="The frontmatter `title:`. Changing it rewrites one line."
				>
					<Input
						value={currentTitle}
						onChange={(event) => setTitle(event.target.value)}
					/>
				</Field>

				<Field
					label="Summary"
					hint="What the index shows before anybody clicks."
				>
					<Textarea
						rows={2}
						value={currentSummary}
						onChange={(event) => setSummary(event.target.value)}
					/>
				</Field>

				<Field
					label="Slug"
					hint={
						found.route
							? `Its address. Changing it moves every file with this slug, and ${found.route} stops answering.`
							: "This document has no route of its own."
					}
				>
					<Input
						value={currentSlug}
						onChange={(event) => setSlug(event.target.value)}
					/>
				</Field>

				<div className="flex items-center gap-2 wrap">
					<Button
						disabled={!retitled}
						onClick={() =>
							onAction({
								action: {
									action: "retitle",
									path: found.path,
									title: currentTitle || undefined,
									summary: currentSummary || undefined,
								},
								apply: false,
							})
						}
					>
						Plan the retitle
					</Button>

					<Button
						variant="ghost"
						disabled={!moved}
						onClick={() =>
							onAction({
								action: {
									action: "move",
									kind: found.kind as "post",
									from: found.slug ?? "",
									to: currentSlug,
								},
								apply: false,
							})
						}
					>
						Plan the slug change
					</Button>

					{retitled || moved ? (
						<Button
							variant="ghost"
							onClick={() => {
								setTitle(undefined);
								setSummary(undefined);
								setSlug(undefined);
							}}
						>
							Discard
						</Button>
					) : null}
				</div>

				{result?.applied ? <p className="fg-dim">{result.message}</p> : null}
			</section>

			{/* ── what it says ──────────────────────────────────────────── */}

			<section className="flex col gap-3">
				<h3>Preview</h3>

				{/*
				 * The document as it is stored, rendered by the same component the
				 * site uses - so this is a preview rather than an approximation.
				 *
				 * No `blocks` map is passed, on purpose. The site's Markdown
				 * vocabulary (`::start:showcase`, `::start:grid`) reaches live
				 * components, and rendering a showcase inside the studio would boot
				 * a 3D viewer and a StackBlitz frame to preview a title change.
				 * Without the map those blocks render as the comments they are,
				 * which is the honest thing for a structural editor to show.
				 */}
				<article className="prose studio-preview">
					<MarkdownView source={found.body} />
				</article>
			</section>
		</div>
	);
}
