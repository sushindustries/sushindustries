import { Fragment, type ReactNode } from "react";
import { Icon } from "./icon.tsx";

export interface BreadcrumbItem {
	readonly label: string;
	/** Omitted on the last crumb: the page someone is already on is not a link. */
	readonly href?: string;
}

export interface BreadcrumbProps {
	/** In order, root first. The last item is the current page. */
	items: readonly BreadcrumbItem[];
	/**
	 * Absolute site origin for the JSON-LD `item` URLs. Omit to skip the
	 * structured data and render only the visible trail.
	 */
	origin?: string;
}

/*
 * The trail, told twice from one list.
 *
 * The visible half is a `<nav>` with the ARIA the pattern requires -
 * `aria-label`, `aria-current` on the page you are on. The machine half is a
 * schema.org `BreadcrumbList` rendered from the same array, which is the only
 * arrangement where the two cannot disagree: search engines are explicit that
 * structured data must describe what the page shows.
 *
 * The last crumb is text, not a link. A link to the page you are on is the
 * one crumb that does nothing, and screen readers announce it as if it did.
 */
export function Breadcrumb({ items, origin }: BreadcrumbProps): ReactNode {
	if (items.length === 0) return null;

	const jsonLd = origin
		? {
				"@context": "https://schema.org",
				"@type": "BreadcrumbList",
				itemListElement: items.map((item, index) => ({
					"@type": "ListItem",
					position: index + 1,
					name: item.label,
					...(item.href ? { item: `${origin}${item.href}` } : {}),
				})),
			}
		: null;

	return (
		<nav className="crumbs" aria-label="Breadcrumb">
			<ol className="crumbs-list">
				{items.map((item, index) => {
					const last = index === items.length - 1;

					return (
						<Fragment key={`${item.label}-${item.href ?? "here"}`}>
							{index > 0 ? (
								<li aria-hidden="true" className="crumbs-sep">
									<Icon name="chevron" size={11} />
								</li>
							) : null}
							<li className="crumbs-item">
								{last || !item.href ? (
									<span aria-current={last ? "page" : undefined}>
										{item.label}
									</span>
								) : (
									<a href={item.href}>{item.label}</a>
								)}
							</li>
						</Fragment>
					);
				})}
			</ol>

			{jsonLd ? (
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON.stringify of local data, no user input
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			) : null}
		</nav>
	);
}
