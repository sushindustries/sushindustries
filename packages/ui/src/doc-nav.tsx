import { type ReactNode, useEffect, useId, useRef } from "react";
import { Icon, type IconName } from "./icon";

export interface DocNavItem {
	/**
	 * The item's own id - a slug, not a path.
	 *
	 * Passed back to `renderLink` beside the href so a typed router can build
	 * the link from its route pattern and params. See `renderLink`.
	 */
	readonly id: string;
	readonly label: string;
	/** Where it goes, already resolved, for hosts that just want an anchor. */
	readonly href: string;
}

export interface DocNavSection {
	readonly id: string;
	readonly label: string;
	/** Shown before the label. A section with no glyph gets the label alone. */
	readonly icon?: IconName;
	/** Its elements, in the order given. A section with none renders nothing. */
	readonly items: readonly DocNavItem[];
}

export interface DocNavProps {
	/** The sections, in the order given. Collect them in a route loader, not here. */
	readonly sections: readonly DocNavSection[];
	/** The item that is open, so it can be marked and scrolled to. */
	readonly active?: string;
	/** Heading on desktop, button text once the rail is a collapsed row. */
	readonly label?: string;
	/**
	 * Renders each link, so the host can use its router's Link.
	 *
	 * `id` is passed alongside the plain href because a typed router needs the
	 * route pattern and its params, not a path that has already been resolved -
	 * handing `Link` a resolved `/components/reveal` gets an anchor with the
	 * right href whose click is intercepted and then silently fails to match
	 * `/components/$slug`. The href stays for hosts that just want an anchor.
	 */
	readonly renderLink: (props: {
		id: string;
		href: string;
		className: string;
		/**
		 * `"page"` on the open item, for the host to spread onto the element.
		 *
		 * Passed through rather than applied here, because `renderLink` owns the
		 * element - this component does not know whether it is getting an anchor
		 * or a router link, so it cannot set an attribute on it. Without it the
		 * rail marks the current page in colour only, which is nothing at all to
		 * a screen reader.
		 */
		"aria-current"?: "page";
		children: ReactNode;
	}) => ReactNode;
}

/*
 * The left rail of a documentation page: the sections of the library, the
 * elements in each, and which one is open.
 *
 * Presentational on purpose. It takes sections as data and renders each link
 * through `renderLink`, so it knows nothing about the routes of the site it is
 * installed in - the same bargain `Archive` makes, for the same reason.
 *
 * Below three columns it becomes a collapsed row above the document, and the
 * collapse is a checkbox and a label rather than React state. A reader who has
 * landed on the wrong element wants the next one immediately, and a control
 * built from state does nothing until hydration. The same markup is a static
 * rail on a wide screen, because CSS hides the control instead of the
 * component rendering something different.
 *
 * Collapsed rather than hidden on a tablet, deliberately. The tab bar above
 * the document moves between one element's own sections; nothing else on the
 * page gets you to the next element, so hiding this outright would cost the
 * whole middle band of screen sizes its way around the library.
 */
export function DocNav({
	sections,
	active,
	label = "Library",
	renderLink,
}: DocNavProps): ReactNode {
	const toggleId = useId();
	const rail = useRef<HTMLElement>(null);

	/*
	 * Bring the open item into view inside the rail, and only inside it.
	 *
	 * `scrollIntoView` is the obvious call and the wrong one: it scrolls every
	 * scrollable ancestor, so landing on an element two thirds down the list
	 * would also scroll the document past its own title before the reader had
	 * seen it. Writing `scrollTop` moves the rail and nothing else.
	 *
	 * In an effect because it reads layout. Deciding it during render would
	 * make the server's HTML and the browser's first pass disagree.
	 */
	useEffect(() => {
		const element = rail.current;
		if (!element || !active) return;

		const target = element.querySelector<HTMLElement>('[data-active="true"]');
		if (!target) return;

		const railBox = element.getBoundingClientRect();
		const targetBox = target.getBoundingClientRect();

		// Already on screen. Scrolling anyway would move the rail under a reader
		// who can see everything they need.
		if (targetBox.top >= railBox.top && targetBox.bottom <= railBox.bottom) {
			return;
		}

		element.scrollTop +=
			targetBox.top - railBox.top - railBox.height / 2 + targetBox.height / 2;
	}, [active]);

	// An empty section is a category nobody has filled yet, not a heading.
	const filled = sections.filter((section) => section.items.length > 0);
	if (filled.length === 0) return null;

	return (
		<nav ref={rail} className="doc-nav" aria-label={label} data-lenis-prevent>
			{/*
			 * Checkbox before the label so `:checked ~` can reach the body. It is
			 * focusable and announced; only its default appearance is hidden.
			 */}
			<input id={toggleId} type="checkbox" className="doc-nav-toggle sr-only" />

			<label className="doc-nav-summary" htmlFor={toggleId}>
				<span className="label m-0">{label}</span>
				<span className="doc-nav-chevron" aria-hidden="true">
					›
				</span>
			</label>

			<div className="doc-nav-body">
				{filled.map((section) => (
					<div key={section.id}>
						<p className="doc-nav-heading label">
							{section.icon ? <Icon name={section.icon} size={12} /> : null}
							{section.label}
						</p>

						<ul className="doc-nav-list">
							{section.items.map((item) => (
								/*
								 * The state is on the row, not on the link, because
								 * `renderLink` owns the link and cannot be given an
								 * attribute. The row is this component's own element, so
								 * marking it is the one thing that cannot be forgotten by
								 * a host that ignores what it is passed.
								 */
								<li
									key={item.id}
									className="doc-nav-item"
									data-active={item.id === active}
								>
									{renderLink({
										id: item.id,
										href: item.href,
										className: "doc-nav-link",
										"aria-current": item.id === active ? "page" : undefined,
										children: item.label,
									})}
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</nav>
	);
}
