import { Fragment, type ReactNode } from "react";
import type { ArchiveCategory, ArchiveItem } from "./archive.schemas";
import { Icon } from "./icon";
import { Pagination } from "./pagination";

export interface ArchiveProps {
	categories: readonly ArchiveCategory[];
	items: readonly ArchiveItem[];
	/** Current category filter id, or `"all"`. */
	active?: string;
	/** Current tag filter, if any. Narrows within the active category. */
	activeTag?: string;
	/** Builds the href for a filter chip. The route owns routing, not this. */
	hrefForCategory: (id: string) => string;
	/** Builds the href for a tag chip. Pass `undefined` to clear the tag. */
	hrefForTag?: (tag: string | undefined) => string;
	/**
	 * Renders the link wrapper, so the host can use its router's Link.
	 *
	 * `kind` and `id` are passed alongside the plain href because a typed
	 * router needs the route pattern and its params, not a path that has
	 * already been resolved - handing `Link` a resolved `/components/reveal`
	 * gets an anchor with the right href whose click is intercepted and then
	 * silently fails to match `/components/$slug`. The href stays for hosts
	 * that just want an anchor.
	 */
	/** 1-based page within the filtered result. Absent means "no pagination". */
	page?: number;
	/** Items per page when `page` is set. */
	pageSize?: number;
	/** Builds the href for a page number. Required when `page` is set. */
	hrefForPage?: (page: number) => string;
	renderLink: (props: {
		kind: "category" | "tag" | "item";
		/** Category id, tag name, or item id. */
		id: string;
		href: string;
		className: string;
		/**
		 * Which colour this belongs to, for the host to spread onto the element.
		 *
		 * Passed through rather than applied here, because `renderLink` owns the
		 * element - this component does not know whether it is getting an anchor,
		 * a router link, or a button, so it cannot set an attribute on it.
		 */
		"data-tone"?: string;
		children: ReactNode;
	}) => ReactNode;
	emptyLabel?: string;
}

/*
 * A filtered grid of things, each showing what it actually is.
 *
 * Two decisions carry this component:
 *
 * **The preview is a live iframe, lazily loaded.** A grid of identical text
 * cards tells a reader nothing - the point of an archive is recognising the
 * thing you half-remember. `loading="lazy"` means only the cards near the
 * viewport ever mount, and `pointer-events: none` means the preview is a
 * picture: clicking anywhere on the card follows the card's link rather than
 * interacting with a component in a frame the reader cannot see the edges of.
 *
 * **Filtering is links, not state.** Each chip is an href, so a filtered view
 * is a URL somebody can send, it survives a reload, and it works before
 * hydration. The route decides what those URLs look like; this only asks for
 * them.
 *
 * Items without a `previewSrc` are not a defect. A frontmatter parser has
 * nothing to show, and inventing a picture for it would be worse than the
 * honest empty card.
 */
export function Archive({
	categories,
	items,
	active = "all",
	activeTag,
	hrefForCategory,
	hrefForTag,
	page,
	pageSize = 24,
	hrefForPage,
	renderLink,
	emptyLabel = "Nothing here yet.",
}: ArchiveProps): ReactNode {
	const inCategory =
		active === "all" ? items : items.filter((item) => item.category === active);

	const matched = activeTag
		? inCategory.filter((item) => item.tags.includes(activeTag))
		: inCategory;

	/*
	 * Paged after filtering, so the numbers describe the result the reader is
	 * actually looking at. `page` clamps rather than 404s: a bookmarked page 3
	 * of a filter that now fits on one page should show the last page, not an
	 * empty grid.
	 */
	const pageCount = Math.max(1, Math.ceil(matched.length / pageSize));
	const current = page ? Math.min(Math.max(1, page), pageCount) : 1;
	const shown = page
		? matched.slice((current - 1) * pageSize, current * pageSize)
		: matched;

	const counts = new Map<string, number>();
	for (const item of items) {
		counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
	}

	/*
	 * Tags are derived from what is currently in scope, not from a fixed list.
	 * Offering every tag in the registry would offer filters that lead to an
	 * empty grid, which is a worse answer than not offering them.
	 */
	const tagCounts = new Map<string, number>();
	for (const item of inCategory) {
		for (const tag of item.tags) {
			tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
		}
	}

	const tags = [...tagCounts.entries()].sort(
		(a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
	);

	return (
		<div className="flex col gap-4">
			<nav className="flex wrap gap-2" aria-label="Filter by category">
				<ArchiveChip
					id="all"
					href={hrefForCategory("all")}
					label="All"
					count={items.length}
					active={active === "all"}
					renderLink={renderLink}
				/>

				{categories.map((category) => (
					<ArchiveChip
						key={category.id}
						id={category.id}
						href={hrefForCategory(category.id)}
						label={category.label}
						count={counts.get(category.id) ?? 0}
						active={active === category.id}
						renderLink={renderLink}
					/>
				))}
			</nav>

			{hrefForTag && tags.length > 0 ? (
				<nav
					className="flex wrap gap-2 items-center mt-3"
					aria-label="Filter by tag"
				>
					{activeTag ? (
						renderLink({
							kind: "tag",
							id: "",
							href: hrefForTag(undefined),
							className: "archive-tag is-active",
							children: <>{activeTag} ✕</>,
						})
					) : (
						<span className="label">Tags</span>
					)}

					{!activeTag &&
						tags.map(([tag, count]) =>
							renderLink({
								kind: "tag",
								id: tag,
								href: hrefForTag(tag),
								className: "archive-tag",
								children: (
									<>
										{tag}
										<span className="archive-count">{count}</span>
									</>
								),
							}),
						)}
				</nav>
			) : null}

			{shown.length === 0 ? (
				<p className="fg-faint mt-6">{emptyLabel}</p>
			) : (
				<div className="archive-grid mt-6">
					{/* Keyed here, because `renderLink` owns the element and a host's
					    Link has no reason to know it is being rendered in a list. */}
					{shown.map((item) => (
						<Fragment key={item.id}>
							{renderLink({
								kind: "item",
								id: item.id,
								href: item.href,
								className: "archive-card",
								// The same tone hook as the nav. The card is the other place
								// a category is visible, and the two must agree.
								"data-tone": item.category,
								children: (
									<>
										<div className="archive-preview">
											{item.previewSrc ? (
												<iframe
													className="archive-frame"
													src={item.previewSrc}
													title={`${item.title} preview`}
													loading="lazy"
													tabIndex={-1}
													aria-hidden="true"
													sandbox="allow-scripts allow-same-origin"
												/>
											) : (
												<span className="label">{item.category}</span>
											)}
										</div>

										{/*
										 * What it costs to install, at a glance.
										 *
										 * Deliberately above the title rather than buried under
										 * the description: somebody scanning twenty-five cards
										 * for something to use is filtering on this, and a fact
										 * that only appears after you have read a paragraph is
										 * not a fact you can scan.
										 */}
										<div className="flex col gap-2 p-4">
											<div className="flex items-center justify-between gap-3">
												<h3 className="h3 m-0 min-w-0 truncate">
													{item.title}
												</h3>
												{item.meta ? (
													<span className="label shrink-0">{item.meta}</span>
												) : null}
											</div>

											{item.subcategory ? (
												<p className="label m-0">{item.subcategory}</p>
											) : null}

											{/*
											 * What installing this drags in.
											 *
											 * The empty case is rendered rather than skipped, and
											 * that is the whole point of the row: "no dependencies"
											 * is the most useful thing most of these can say about
											 * themselves, and expressing it as an *absence of
											 * chips* means it is never actually said. A reader
											 * scanning a grid cannot tell the difference between a
											 * component with no dependencies and one whose row
											 * failed to render.
											 */}
											<p className="archive-deps m-0">
												{item.dependencies.length === 0 ? (
													<span className="archive-dep" data-none="true">
														<Icon name="rule" size={12} />
														No dependencies
													</span>
												) : (
													item.dependencies.map((name) => (
														<span key={name} className="archive-dep">
															<Icon name="package" size={12} />
															{name}
														</span>
													))
												)}
											</p>

											<p className="m-0 fg-dim text-sm text-pretty">
												{item.description}
											</p>

											{/*
											 * The preview is aria-hidden, so this sentence is the
											 * only description of it a screen reader will get.
											 */}
											{item.preview ? (
												<p className="sr-only">Preview: {item.preview}</p>
											) : null}
										</div>
									</>
								),
							})}
						</Fragment>
					))}
				</div>
			)}

			{page && hrefForPage ? (
				<div className="mt-7">
					<Pagination
						page={current}
						pageCount={pageCount}
						hrefFor={hrefForPage}
					/>
				</div>
			) : null}
		</div>
	);
}

function ArchiveChip({
	id,
	href,
	label,
	count,
	active,
	renderLink,
}: {
	id: string;
	href: string;
	label: string;
	count: number;
	active: boolean;
	renderLink: ArchiveProps["renderLink"];
}): ReactNode {
	return renderLink({
		kind: "category",
		id,
		href,
		className: active ? "archive-chip is-active" : "archive-chip",
		children: (
			<>
				{label}
				<span className="archive-count">{count}</span>
			</>
		),
	});
}
