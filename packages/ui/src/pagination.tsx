import type { ReactNode } from "react";
import { Icon } from "./icon";

export interface PaginationProps {
	/** 1-based. */
	page: number;
	pageCount: number;
	/** Builds the href for a page number; the host's router owns the URL shape. */
	hrefFor: (page: number) => string;
	/**
	 * Rendered around every href, so a router can own navigation.
	 *
	 * `page` is the number the link leads to, passed alongside the resolved
	 * href because a typed router builds its link from a route pattern and
	 * params, not from a path that has already been flattened into a string.
	 */
	renderLink?: (props: {
		page: number;
		href: string;
		className: string;
		"aria-current"?: "page";
		"aria-label"?: string;
		"data-dir"?: "next";
		children: ReactNode;
	}) => ReactNode;
}

/*
 * Pages, numbered, with the ends always reachable.
 *
 * The window is first and last plus one page either side of the current one,
 * with an ellipsis where numbers were elided - the shape every reader already
 * knows. Links, not buttons: a page is an address, and pagination that cannot
 * be opened in a new tab or crawled is state pretending to be navigation.
 */
function windowed(page: number, pageCount: number): Array<number | "gap"> {
	const wanted = new Set([1, pageCount, page - 1, page, page + 1]);
	const pages = [...wanted]
		.filter((n) => n >= 1 && n <= pageCount)
		.sort((a, b) => a - b);

	const out: Array<number | "gap"> = [];
	for (const [index, n] of pages.entries()) {
		const previous = pages[index - 1];
		if (previous !== undefined && n - previous > 1) out.push("gap");
		out.push(n);
	}
	return out;
}

export function Pagination({
	page,
	pageCount,
	hrefFor,
	renderLink,
}: PaginationProps): ReactNode {
	if (pageCount <= 1) return null;

	const link =
		renderLink ??
		(({ children, page: _page, ...props }) => <a {...props}>{children}</a>);

	return (
		<nav
			className="flex items-center justify-center gap-1 mono text-sm"
			aria-label="Pages"
		>
			{page > 1
				? link({
						page: page - 1,
						href: hrefFor(page - 1),
						className: "pages-step",
						"aria-label": "Previous page",
						children: <Icon name="chevron" size={12} />,
					})
				: null}

			{windowed(page, pageCount).map((entry, index) =>
				entry === "gap" ? (
					// biome-ignore lint/suspicious/noArrayIndexKey: gaps have no identity beyond position
					<span key={`gap-${index}`} className="pages-gap">
						…
					</span>
				) : (
					<span key={entry}>
						{link({
							page: entry,
							href: hrefFor(entry),
							className: "pages-num",
							"aria-current": entry === page ? "page" : undefined,
							children: String(entry),
						})}
					</span>
				),
			)}

			{page < pageCount
				? link({
						page: page + 1,
						href: hrefFor(page + 1),
						className: "pages-step",
						"data-dir": "next",
						"aria-label": "Next page",
						children: <Icon name="chevron" size={12} />,
					})
				: null}
		</nav>
	);
}
