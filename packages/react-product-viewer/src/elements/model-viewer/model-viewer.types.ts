import type {
	ModelConfig,
	ZoneScheme,
	ZoneTints,
} from "@sushindustries/product-viewer";
import type { GLTF } from "three-stdlib";
import type { ReactNode, RefObject } from "react";
import type { LoadingOverlayRenderer } from "../../loading-overlay";

/**
 * What the wheel does over the canvas.
 *
 * This is the single most consequential prop here, because getting it wrong
 * breaks the page rather than the viewer. Orbit controls capture the wheel to
 * zoom; a full-width viewer that captures the wheel is a region of the document
 * a visitor cannot scroll past. On a phone, where the viewer is the width of
 * the screen, that means the page is stuck.
 *
 * | Value | Wheel over the canvas | For |
 * | --- | --- | --- |
 * | `zoom` | zooms the model | a dialog, a stage, anything the visitor opened deliberately |
 * | `page` | scrolls the page | a hero, a card, anything in the flow of a document |
 * | `modifier` | scrolls the page, and zooms while ctrl or cmd is held | a large in-page viewer that still wants zoom |
 *
 * Dragging always orbits, in every mode. It is only the wheel that is in
 * question, because dragging is unambiguous and scrolling is not.
 *
 * `modifier` is the same bargain a map embedded in an article makes, and for
 * the same reason: the visitor scrolling past should not be captured, but the
 * visitor who stopped to look should still be able to zoom.
 */
export type ModelViewerScroll = "zoom" | "page" | "modifier";

export interface ModelViewerProps<S extends ZoneScheme = ZoneScheme> {
	model: ModelConfig;

	/**
	 * An already-loaded asset, for when something else owns the cache.
	 *
	 * Pass the data from `productModelOptions` and the GLB is fetched by the
	 * route loader - on hover, under `defaultPreload: "intent"` - rather than on
	 * mount. When this is set the viewer draws no progress overlay, because
	 * whoever owns the loading owns showing its progress.
	 */
	gltf?: GLTF;

	/** GLB variant names to apply, in order. */
	variants?: readonly string[];

	/** The zones `zoneTints` is keyed by. Required alongside it. */
	zoneScheme?: S;

	/** Per-zone colour multipliers, for single-mesh models. */
	zoneTints?: ZoneTints<S>;

	/**
	 * What the wheel does. @default "zoom"
	 *
	 * The default suits a viewer somebody opened. A viewer somebody scrolled
	 * past wants `page`.
	 */
	scroll?: ModelViewerScroll;

	/** Replaces the procedural room lighting. Pass a component, not a value. */
	environment?: ReactNode;

	/** A one-unit grid on the floor. Only meaningful with `realLength` set. */
	grid?: boolean;

	/**
	 * Clamp the orbit above the horizon. True for anything that sits on the
	 * ground; false for objects people pick up and look at from underneath.
	 */
	groundBound?: boolean;

	/** Set to capture the current frame as a PNG data URL. */
	snapshotRef?: RefObject<(() => string) | null>;

	loadingLabel?: string;

	/** Replaces the default progress overlay entirely. */
	loadingOverlay?: LoadingOverlayRenderer;

	/**
	 * Shown once, briefly, when someone scrolls over a `modifier` viewer.
	 *
	 * Set to `null` to suppress it. @default "Hold ⌘ or Ctrl to zoom"
	 */
	scrollHint?: ReactNode;

	/** Added after `pv-viewer`. */
	className?: string;

	/** Drawn inside the scene's Suspense boundary - hotspots, helpers. */
	children?: ReactNode;
}
