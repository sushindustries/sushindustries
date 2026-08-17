import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

/*
 * The top of a documentation page, as one component.
 *
 * Before this, every page assembled its own head out of a breadcrumb, an h1, a
 * paragraph and a row of chips, and the four pages that did it disagreed about
 * all four - different gaps, different order, and only one of them said when
 * the page was last touched. A head that is composed in four places is a head
 * with four opinions.
 *
 * It takes slots rather than data, deliberately. `trail` is whatever the site
 * renders as a breadcrumb, `actions` is whatever it renders as buttons, and
 * neither is a route this package has to know about. What Hero owns is the
 * arrangement: what sits beside what, what wraps first, and what happens when
 * the picture is missing.
 */

/** One measured fact about the page. Rendered as a glyph and a phrase. */
export interface HeroFact {
	readonly icon?: IconName;
	/** Read aloud, and shown as a tooltip. The visible text is `value`. */
	readonly label: string;
	readonly value: ReactNode;
}

/** One rendition of the shot, at the width it was captured at. */
export interface HeroShotSource {
	readonly src: string;
	/** Intrinsic width in CSS pixels. Becomes the `w` descriptor. */
	readonly width: number;
}

export interface HeroShot {
	/**
	 * Every width the picture exists at, narrowest first.
	 *
	 * A `srcset` rather than one file because the shots are taken on the three
	 * machines the site draws itself as, and a phone that downloads the laptop
	 * capture has paid for four times the pixels it can show.
	 */
	readonly sources: readonly HeroShotSource[];
	readonly alt: string;
	/**
	 * `aspect-ratio` for the frame, e.g. `"16 / 10"`. The box is sized before
	 * the bytes arrive, so nothing below the hero moves when they do.
	 */
	readonly aspect?: string;
	/** Passed straight through. Defaults to the two-column layout's behaviour. */
	readonly sizes?: string;
}

export interface HeroProps {
	/**
	 * Which job this hero is doing.
	 *
	 * `landing` is the top of a home page: full height, the mark beside the
	 * sentence, one action and one alternative. `doc` is the head of a
	 * documentation page. They share the split, the actions row and the wrap
	 * order, and differ in height and type scale - which is why they are one
	 * component with an attribute rather than two components.
	 */
	readonly variant?: "doc" | "landing";
	/** Above the heading. A breadcrumb, usually. */
	readonly trail?: ReactNode;
	/**
	 * The element's own id, rendered as `<name>`.
	 *
	 * A component in this library is a tag before it is a page, and writing it
	 * the way it is written in markup is the shortest true description of what
	 * the reader has arrived at. When it is absent the heading falls back to
	 * `title`, which is what a page that is not an element wants.
	 */
	readonly name?: string;
	readonly title: string;
	/** Shown as a chip beside the heading. The element's version, not the package's. */
	readonly version?: string;
	/** One paragraph under the heading. Absent puts the facts straight beneath it. */
	readonly summary?: ReactNode;
	/** Keyed by `label`, so two facts cannot share one. Empty renders no list at all. */
	readonly facts?: readonly HeroFact[];
	/** The one or two things to do here. Composed by the caller. */
	readonly actions?: ReactNode;
	/** A picture of the thing, taken at each device width. */
	readonly shot?: HeroShot;
	/**
	 * Anything else for the second column - a 3D mark, a live frame, a chart.
	 * Ignored when `shot` is given, because a hero has one second column and
	 * two things fighting for it is a bug rather than a layout.
	 */
	readonly media?: ReactNode;
	/** Below everything, full width. The section tabs, usually. */
	readonly children?: ReactNode;
}

/*
 * The brackets are dimmed rather than dropped.
 *
 * `avatar` on its own reads as a word; `<avatar>` reads as an element, and the
 * only part doing that work is the punctuation. Dimming it keeps the name the
 * thing your eye lands on while the brackets still say what kind of thing it
 * is.
 */
function ElementName({ name }: { name: string }): ReactNode {
	return (
		<span className="hero-name">
			<span className="hero-bracket">&lt;</span>
			{name}
			<span className="hero-bracket">&gt;</span>
		</span>
	);
}

function Shot({ shot }: { shot: HeroShot }): ReactNode {
	// Widest last, so the plain `src` is the best a browser without srcset gets.
	const ordered = [...shot.sources].sort((a, b) => a.width - b.width);
	const widest = ordered.at(-1);
	if (!widest) return null;

	return (
		<figure
			className="hero-shot"
			style={shot.aspect ? { aspectRatio: shot.aspect } : undefined}
		>
			{/*
			 * Eager and high priority: this is the largest thing above the fold,
			 * so it is the LCP element on every page that has one. Lazy-loading
			 * the LCP element is the single most common way to lose the metric.
			 */}
			<img
				className="hero-shot-image"
				src={widest.src}
				srcSet={ordered.map((one) => `${one.src} ${one.width}w`).join(", ")}
				sizes={shot.sizes ?? "(min-width: 60rem) 30rem, 100vw"}
				alt={shot.alt}
				width={widest.width}
				decoding="async"
				fetchPriority="high"
			/>
		</figure>
	);
}

export function Hero({
	variant = "doc",
	trail,
	name,
	title,
	version,
	summary,
	facts,
	actions,
	shot,
	media,
	children,
}: HeroProps): ReactNode {
	const second = shot ? <Shot shot={shot} /> : media;

	return (
		<header className="hero cq" data-variant={variant}>
			{trail}

			<div className="hero-split" data-media={second ? "" : undefined}>
				<div className="hero-body">
					{/* The name and its version travel together and wrap together. */}
					<div className="flex items-baseline wrap gap-3">
						<h1 className="hero-title">
							{name ? <ElementName name={name} /> : title}
						</h1>
						{version ? <span className="hero-version">v{version}</span> : null}
					</div>

					{summary ? <p className="hero-summary">{summary}</p> : null}

					{facts && facts.length > 0 ? (
						<dl className="hero-facts">
							{facts.map((fact) => (
								<div className="hero-fact" key={fact.label}>
									{/*
									 * The label is the accessible name and the tooltip; the
									 * glyph is what a sighted reader actually parses. Showing
									 * both would put "Last updated" and a calendar beside a
									 * date, which is the same fact three times.
									 */}
									<dt className="hero-fact-label">{fact.label}</dt>
									<dd className="hero-fact-value" title={fact.label}>
										{fact.icon ? <Icon name={fact.icon} size={13} /> : null}
										{fact.value}
									</dd>
								</div>
							))}
						</dl>
					) : null}

					{actions ? <div className="hero-actions">{actions}</div> : null}
				</div>

				{second}
			</div>

			{children}
		</header>
	);
}
