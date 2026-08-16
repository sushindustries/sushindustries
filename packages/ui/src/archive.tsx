import type { ReactNode } from "react";
import type { ArchiveCategory, ArchiveItem } from "./archive.schemas";

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
	renderLink: (props: {
		kind: "category" | "tag" | "item";
		/** Category id, tag name, or item id. */
		id: string;
		href: string;
		className: string;
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
	renderLink,
	emptyLabel = "Nothing here yet.",
}: ArchiveProps): ReactNode {
	const inCategory =
		active === "all" ? items : items.filter((item) => item.category === active);

	const shown = activeTag
		? inCategory.filter((item) => item.tags.includes(activeTag))
		: inCategory;

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
		<div className="archive">
			<nav className="archive-filters" aria-label="Filter by category">
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
				<nav className="archive-filters mt-3" aria-label="Filter by tag">
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
					{shown.map((item) =>
						renderLink({
							kind: "item",
							id: item.id,
							href: item.href,
							className: "archive-card",
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

									<div className="archive-body">
										<div className="flex items-center justify-between gap-3">
											<h3 className="h3 m-0 min-w-0 truncate">{item.title}</h3>
											{item.meta ? (
												<span className="label shrink-0">{item.meta}</span>
											) : null}
										</div>

										{item.subcategory ? (
											<p className="label m-0">{item.subcategory}</p>
										) : null}

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
						}),
					)}
				</div>
			)}
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
