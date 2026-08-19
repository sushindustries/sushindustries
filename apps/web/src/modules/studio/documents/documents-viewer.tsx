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
 * Four things can change here: the title, the summary, the slug, and the whole
 * document. The first three rewrite one line each and review as what they are;
 * the fourth replaces the file, which is why it is a separate action rather
 * than a superset of the others - one action for both would make every title
 * change look like a rewrite in the diff.
 *
 * The body editor is a plain textarea over the whole file, frontmatter
 * included, and that is a choice rather than a shortcut. This is a Markdown
 * file that is checked into git, reviewed as a diff and rendered through a
 * block dispatcher; a rich editor over it would have to round-trip every
 * construct it does not understand, and the constructs it would not understand
 * are this site's own blocks. A textarea round-trips everything by not trying.
 *
 * Every save carries the `sha` it opened with, and is refused if the file has
 * moved since. That is the only protection an editor over a repository can
 * offer, and without it the second save silently discards the first.
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

	/*
	 * The draft, and whether the editor is showing.
	 *
	 * `undefined` until somebody types, like the three fields above: it means
	 * "whatever the document says", so the pane always shows the current file
	 * without an effect to re-seed it when the selection changes. That effect
	 * is the usual way an editor ends up holding the previous document's text.
	 *
	 * The workspace remounts this on every selection (`key={selected}`), so
	 * there is no stale draft to carry across either.
	 */
	const [editing, setEditing] = useState(false);
	const [edited, setEdited] = useState<string | undefined>();

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

	const draft = edited ?? found.body;
	const dirty = draft !== found.body;
	const setDraft = setEdited;

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
				<div className="flex items-center gap-3 wrap">
					<h3 className="flex-1 m-0">{editing ? "Editing" : "Preview"}</h3>

					{/*
					 * Both panes at once when there is room, one at a time when there
					 * is not. Which is which is a choice rather than a breakpoint,
					 * because the useful arrangement depends on what you are doing -
					 * writing wants the editor wide, reviewing wants the preview wide.
					 */}
					<div className="flex items-center gap-2">
						<Button
							variant={editing ? "ghost" : "pill"}
							onClick={() => setEditing(false)}
						>
							Read
						</Button>
						<Button
							variant={editing ? "pill" : "ghost"}
							onClick={() => setEditing(true)}
						>
							Edit
						</Button>
					</div>
				</div>

				{editing ? (
					<div className="flex col gap-3">
						{/*
						 * A plain textarea over the whole file, frontmatter included.
						 *
						 * Deliberately not a rich editor. This is a Markdown file that
						 * is checked into git, reviewed as a diff and rendered through a
						 * block dispatcher - a WYSIWYG surface over it would have to
						 * round-trip every construct it does not understand, and the
						 * ones it does not understand here are the site's own blocks.
						 * A textarea round-trips everything by not trying.
						 *
						 * The frontmatter is in it because it is in the file. Hiding it
						 * would mean two editors for one document and a merge between
						 * them every time somebody used both.
						 */}
						<Textarea
							value={draft}
							rows={24}
							spellCheck={false}
							aria-label={`The full text of ${found.path}`}
							className="mono studio-editor"
							onChange={(event) => setDraft(event.target.value)}
						/>

						<div className="flex items-center gap-2 wrap">
							<Button
								disabled={!dirty}
								onClick={() =>
									onAction({
										action: {
											action: "edit",
											path: found.path,
											body: draft,
											// The version this editor opened. The write is
											// refused if the file has moved since, which is the
											// only protection an editor over a repository can
											// offer - without it the second save silently
											// discards the first.
											sha: found.sha,
										},
										apply: false,
									})
								}
							>
								Plan the save
							</Button>

							{dirty ? (
								<Button variant="ghost" onClick={() => setDraft(found.body)}>
									Discard changes
								</Button>
							) : (
								<span className="fg-faint text-xs mono">
									no changes · sha {found.sha.slice(0, 8)}
								</span>
							)}
						</div>
					</div>
				) : null}

				{/*
				 * The document rendered by the same component the site uses, so this
				 * is a preview rather than an approximation - and it renders the
				 * *draft*, so what is on screen is what would be saved.
				 *
				 * No `blocks` map is passed, on purpose. The site's Markdown
				 * vocabulary (`::start:showcase`, `::start:grid`) reaches live
				 * components, and rendering a showcase here would boot a 3D viewer
				 * and a StackBlitz frame to preview a sentence. Without the map they
				 * render as the comments they are, which is the honest thing for an
				 * editor to show.
				 */}
				<article className="prose studio-preview">
					<MarkdownView source={withoutFrontmatter(draft)} />
				</article>
			</section>
		</div>
	);
}

/**
 * The body without its frontmatter block.
 *
 * The editor holds the whole file because that is what gets written; the
 * preview shows what a reader would see, and a reader never sees the
 * frontmatter. Rendering it would put a `---` rule and a list of key-value
 * pairs at the top of every preview, which is not what the page looks like.
 */
function withoutFrontmatter(text: string): string {
	const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(text);
	return match ? text.slice(match[0].length) : text;
}
