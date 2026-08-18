import type { ModelConfig } from "@sushindustries/product-viewer";
import type { ReactNode } from "react";
import type { GLTF } from "three-stdlib";

/**
 * When a card stops being a picture and becomes a running WebGL scene.
 *
 * The default is `never`, and it is the default because of a hard browser
 * limit rather than a preference: a page may hold roughly sixteen live WebGL
 * contexts, after which the browser silently discards the oldest. A twenty-card
 * grid of live viewers does not render slowly, it renders wrong - cards go
 * black as you scroll, and the ones that come back have lost their materials.
 *
 * | Value | Upgrades when | Use for |
 * | --- | --- | --- |
 * | `never` | it does not | grids, listings, search results |
 * | `hover` | the pointer enters, on fine pointers only | a short row on desktop |
 * | `press` | the visitor clicks or taps the poster | anywhere, including phones |
 * | `visible` | the card scrolls into view | one or two featured cards |
 *
 * `hover` deliberately does nothing on a touch device. There is no hover there
 * to speak of, and upgrading on the tap that was meant to open the product page
 * spends a WebGL context on a card the visitor is leaving.
 */
export type ModelCardActivation = "never" | "hover" | "press" | "visible";

export interface ModelCardProps {
	/** The product name. Clamped to one line, so long names truncate rather than break the grid. */
	title: string;

	/**
	 * A line under the title. Clamped to two lines, always.
	 *
	 * Two rather than one because most product descriptions need two, and fixed
	 * rather than natural because a grid whose cards are different heights reads
	 * as broken. The space is reserved whether or not the text fills it.
	 */
	description?: string;

	/**
	 * The asset this card is for.
	 *
	 * Required even when the card never activates: it is what a poster is a
	 * picture *of*, and what the viewer loads if the card is upgraded.
	 */
	model: ModelConfig;

	/**
	 * A still of the model, shown until the card activates.
	 *
	 * This is the normal way to render a card, and it should almost always be
	 * set. `snapshotRef` on the viewer produces one at the right angle; save it
	 * once and serve it as an ordinary image.
	 *
	 * Without it the card shows a neutral placeholder, which is honest but dull.
	 */
	poster?: string;

	/**
	 * An already-loaded asset, so activating costs no network.
	 *
	 * Only meaningful alongside an `activateOn` other than `never`.
	 */
	gltf?: GLTF;

	/** GLB variant names to apply once the card is live. */
	variants?: readonly string[];

	/** @default "never" */
	activateOn?: ModelCardActivation;

	/**
	 * Shape of the visual area, as a CSS `aspect-ratio`.
	 *
	 * A ratio rather than a height, so a card in a narrow column and a card in a
	 * wide one stay the same shape. @default "4 / 3"
	 */
	aspect?: string;

	/** Makes the whole card a link. Mutually exclusive with `onSelect`. */
	href?: string;

	/**
	 * Makes the whole card a button.
	 *
	 * Use this for opening a dialog or a drawer. Use `href` when the card leads
	 * to a page - a real link can be middle-clicked, copied and opened in a new
	 * tab, and a button that calls `router.navigate` can do none of those.
	 */
	onSelect?: () => void;

	/** Sits over the top-left of the visual: "New", "3 colours", a discount. */
	badge?: ReactNode;

	/** The bottom row: price, a swatch strip, an add-to-basket control. */
	footer?: ReactNode;

	/** Replaces the poster and the viewer entirely. */
	media?: ReactNode;

	/** Added after `pv-card`. */
	className?: string;
}
