import type { CSSProperties, ReactElement, ReactNode } from "react";
import { lazy, Suspense, useRef } from "react";
import type { ModelCardProps } from "./model-card.types";
import { useCardActivation } from "./use-card-activation";

/**
 * A product card whose picture is a 3D model.
 *
 * **A card is a picture by default, and that is the feature.** Nothing here
 * imports three until a card actually activates, so a catalogue page of forty
 * cards ships no WebGL, no loaders and no ~600 kB of renderer - it ships an
 * image per card, like every other product grid. The viewer arrives in a
 * separate chunk, for the one card someone chose to look at.
 *
 * That is not a performance nicety, it is the only design that works. Browsers
 * cap live WebGL contexts at around sixteen and discard the oldest in silence,
 * so a grid of live viewers is not a slow grid - it is a broken one, with cards
 * that go black on scroll and lose their materials on the way back.
 *
 * Styling is class names and `data-*`, so `.pv-card[data-active]` is yours to
 * restyle without importing our stylesheet at all.
 */

// Lazily, and from inside this module rather than the consumer's, so the split
// happens whether or not they remember to ask for it. A card that never
// activates never downloads any of this.
const ModelViewer = lazy(async () => {
	const module = await import("../model-viewer/model-viewer");
	return { default: module.ModelViewer };
});

const PLAY_ICON = (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.8"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
		<path d="m3.3 7 8.7 5 8.7-5" />
		<path d="M12 22V12" />
	</svg>
);

export function ModelCard({
	title,
	description,
	model,
	poster,
	gltf,
	variants,
	activateOn = "never",
	aspect = "4 / 3",
	href,
	onSelect,
	badge,
	footer,
	media,
	className,
}: ModelCardProps): ReactElement {
	const hostRef = useRef<HTMLElement>(null);
	const { active, hostProps, activate } = useCardActivation(
		activateOn,
		hostRef,
	);

	/*
	 * The title carries the link, and the link covers the card.
	 *
	 * The obvious construction - wrap the whole card in an `<a>` - puts the
	 * footer's buttons inside an anchor, which is invalid HTML and behaves
	 * accordingly: screen readers announce one enormous link, and a nested
	 * button may or may not receive its own click depending on the browser.
	 *
	 * Instead the anchor stays around the title where it belongs and its
	 * `::after` is stretched over the card in CSS. The whole card is clickable,
	 * the accessible name is just the title, middle-click and copy-link work
	 * because it is a real anchor, and the footer sits above it on its own
	 * stacking level so its controls keep their clicks.
	 */
	const label: ReactNode = href ? (
		<a className="pv-card__link pv-u-focus" href={href}>
			{title}
		</a>
	) : onSelect ? (
		<button
			type="button"
			className="pv-card__link pv-u-control pv-u-focus"
			onClick={onSelect}
		>
			{title}
		</button>
	) : (
		title
	);

	const visual: ReactNode =
		media ??
		(active ? (
			// The poster stays as the fallback, so activating crossfades from the
			// still to the scene rather than blanking the card while three loads.
			<Suspense fallback={<Poster poster={poster} />}>
				<ModelViewer
					model={model}
					gltf={gltf}
					variants={variants}
					// A card is a thumbnail. Zooming it is not a gesture anyone wants,
					// and a wheel-capturing card inside a scrolling grid traps the page.
					scroll="page"
					grid={false}
				/>
			</Suspense>
		) : (
			<Poster poster={poster} />
		));

	return (
		<article
			ref={hostRef}
			data-active={active || undefined}
			className={["pv-card", className].filter(Boolean).join(" ")}
			// A value, not a decision: the stylesheet owns what to do with it.
			style={{ "--pv-card-aspect": aspect } as CSSProperties}
			{...hostProps}
		>
			<div className="pv-card__visual">
				{visual}
				{badge ? <div className="pv-card__badge">{badge}</div> : null}

				{activateOn === "press" && !active ? (
					<button
						type="button"
						className="pv-card__activate pv-u-control pv-u-press pv-u-focus pv-u-tap"
						onClick={activate}
						aria-label={`View ${title} in 3D`}
					>
						{PLAY_ICON}
					</button>
				) : null}
			</div>

			<div className="pv-card__body">
				<h3 className="pv-card__title pv-u-clamp-1">{label}</h3>
				{description ? (
					<p className="pv-card__description pv-u-clamp-2">{description}</p>
				) : null}
				{footer ? <div className="pv-card__footer">{footer}</div> : null}
			</div>
		</article>
	);
}

/**
 * The still, or a neutral panel when there is not one.
 *
 * `alt=""` on purpose: the title beside it already names the product, so
 * describing the picture again makes a screen reader say everything twice.
 */
function Poster({ poster }: { poster?: string }): ReactElement {
	return poster ? (
		<img className="pv-card__poster" src={poster} alt="" loading="lazy" />
	) : (
		<div className="pv-card__placeholder" aria-hidden="true" />
	);
}
