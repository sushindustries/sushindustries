import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export interface NavItem {
	readonly label: string;
	readonly href: string;
	readonly icon?: IconName;
	/** One line, shown under the label in an expanded panel. */
	readonly description?: string;
	/** A count, shown right-aligned. Nothing renders when it is absent. */
	readonly badge?: string;
}

export interface NavEntry {
	readonly label: string;
	readonly href: string;
	readonly icon?: IconName;
	/**
	 * The expanded panel. An entry with no children is a plain link, which is
	 * the right answer for most of them: a menu that opens to reveal one link
	 * is more interface than the thing it hides.
	 */
	readonly items?: readonly NavItem[];
}

export interface NavBarProps {
	brand: ReactNode;
	brandHref?: string;
	entries: readonly NavEntry[];
	/** Right-hand side. Usually one external link. */
	trailing?: ReactNode;
	/** Label on the mobile toggle, for screen readers. */
	menuLabel?: string;
	/** Rendered around every href, so a router can own navigation. */
	renderLink?: (props: {
		href: string;
		className: string;
		children: ReactNode;
	}) => ReactNode;
}

type RenderLink = NonNullable<NavBarProps["renderLink"]>;

/*
 * The site header, at three sizes, with panels that expand.
 *
 * Built on `<details>` and `<summary>` rather than on React state, and that is
 * not a stylistic preference. A nav is the first thing a reader touches, often
 * before hydration has finished, and a menu driven by `useState` is inert until
 * then. `<details>` opens on click and on Enter, is announced as expandable,
 * closes on Escape, and does all of it in the browser with no JavaScript from
 * here at all.
 *
 * What it costs is close-on-outside-click, which `<details>` has no notion of.
 * That is bought back with one `onBlur` - twelve lines, degrading to "the panel
 * stays open until you click the summary again", which is a mildly annoying
 * menu rather than a broken one.
 *
 *   desktop  a row of triggers, each opening a panel below it
 *   tablet   the same row, with a narrower panel
 *   mobile   one burger, opening every entry as an accordion
 *
 * The mobile version is the same markup with different CSS, not a second
 * component. Two components would be two things to keep in step, and the one
 * that is only visible on a phone is the one that goes stale.
 *
 * The component knows nothing about which site it is in. Entries come in as
 * data; on this site that data is a Markdown file.
 */
function closeOnLeave(event: React.FocusEvent<HTMLDetailsElement>): void {
	if (event.currentTarget.contains(event.relatedTarget)) return;
	event.currentTarget.removeAttribute("open");
}

/*
 * A group's own icon, on the same tile its items use.
 *
 * In the drawer every row is one column of tiles down the left edge. A group
 * header with a bare 14px glyph beside rows with 34px tiles reads as two
 * different lists rather than as a heading over its items - and at that size,
 * against uppercase mono, the glyph is close to invisible.
 *
 * An entry with no icon still gets the tile, empty, so the labels stay on one
 * vertical line. A ragged left edge is more noticeable than a blank square.
 */
function GroupIcon({ icon }: { icon?: IconName }): ReactNode {
	return (
		<span className="nav-panel-icon" aria-hidden="true">
			{icon ? <Icon name={icon} size={16} /> : null}
		</span>
	);
}

function PanelItems({
	items,
	renderLink,
}: {
	items: readonly NavItem[];
	renderLink: RenderLink;
}): ReactNode {
	return (
		<ul className="nav-panel-list m-0">
			{items.map((item) => (
				<li key={item.href}>
					{renderLink({
						href: item.href,
						className: "nav-panel-item",
						children: (
							<>
								{item.icon ? (
									<span className="nav-panel-icon">
										<Icon name={item.icon} size={16} />
									</span>
								) : null}
								<span className="min-w-0">
									<span className="nav-panel-label flex items-baseline gap-2">
										{item.label}
										{item.badge ? (
											<span className="nav-panel-badge">{item.badge}</span>
										) : null}
									</span>
									{item.description ? (
										<span className="nav-panel-description">
											{item.description}
										</span>
									) : null}
								</span>
							</>
						),
					})}
				</li>
			))}
		</ul>
	);
}

function Panel({
	entry,
	renderLink,
}: {
	entry: NavEntry;
	renderLink: RenderLink;
}): ReactNode {
	return (
		<details className="nav-menu" onBlur={closeOnLeave}>
			<summary className="nav-link flex items-center gap-2">
				{entry.icon ? <Icon name={entry.icon} size={14} /> : null}
				{entry.label}
				<Icon name="chevron" size={13} className="nav-chevron" />
			</summary>

			<div className="nav-panel">
				<PanelItems items={entry.items ?? []} renderLink={renderLink} />

				{/* The panel lists parts of a section; this goes to the section. */}
				{renderLink({
					href: entry.href,
					className: "nav-panel-all",
					children: `All ${entry.label.toLowerCase()}`,
				})}
			</div>
		</details>
	);
}

export function NavBar({
	brand,
	brandHref = "/",
	entries,
	trailing,
	menuLabel = "Menu",
	renderLink = (props) => <a {...props} />,
}: NavBarProps): ReactNode {
	return (
		<header className="nav">
			<nav className="container flex items-center justify-between gap-4 py-3">
				{renderLink({
					href: brandHref,
					className: "nav-brand flex items-center gap-3 shrink-0",
					children: brand,
				})}

				{/* Wide: a row of triggers. */}
				<div className="nav-row flex items-center gap-1">
					{entries.map((entry) =>
						entry.items && entry.items.length > 0 ? (
							<Panel key={entry.href} entry={entry} renderLink={renderLink} />
						) : (
							<span key={entry.href}>
								{renderLink({
									href: entry.href,
									className: "nav-link flex items-center gap-2",
									children: (
										<>
											{entry.icon ? <Icon name={entry.icon} size={14} /> : null}
											{entry.label}
										</>
									),
								})}
							</span>
						),
					)}
				</div>

				<div className="flex items-center gap-2 shrink-0">
					{trailing}

					{/*
					 * Narrow: one burger holding everything.
					 *
					 * The bars are drawn in CSS rather than as a glyph, because they
					 * become an X when the details is open and a glyph cannot morph.
					 */}
					<details className="nav-burger" onBlur={closeOnLeave}>
						<summary className="nav-burger-toggle" aria-label={menuLabel}>
							<span className="nav-burger-bars" />
						</summary>

						{/*
						 * `data-lenis-prevent` hands scrolling inside the drawer back
						 * to the browser.
						 *
						 * A smooth-scroll driver like Lenis intercepts wheel and touch
						 * for the whole page and animates the scroll itself. An
						 * overlay with its own overflow is invisible to it, so a drag
						 * inside this drawer moved the article behind it instead. Lenis
						 * reads this attribute and leaves the subtree alone; anyone not
						 * using Lenis gets an inert data attribute.
						 */}
						<div className="nav-sheet" data-lenis-prevent>
							<p className="nav-sheet-title label m-0">{menuLabel}</p>

							{entries.map((entry) =>
								entry.items && entry.items.length > 0 ? (
									<details className="nav-group" key={entry.href}>
										<summary className="nav-group-summary flex items-center gap-3">
											<GroupIcon icon={entry.icon} />
											{entry.label}
											<Icon name="chevron" size={13} className="nav-chevron" />
										</summary>

										<PanelItems items={entry.items} renderLink={renderLink} />

										{renderLink({
											href: entry.href,
											className: "nav-panel-all",
											children: `All ${entry.label.toLowerCase()}`,
										})}
									</details>
								) : (
									<span key={entry.href}>
										{renderLink({
											href: entry.href,
											className: "nav-group-summary flex items-center gap-3",
											children: (
												<>
													<GroupIcon icon={entry.icon} />
													{entry.label}
												</>
											),
										})}
									</span>
								),
							)}
						</div>
					</details>
				</div>
			</nav>
		</header>
	);
}
