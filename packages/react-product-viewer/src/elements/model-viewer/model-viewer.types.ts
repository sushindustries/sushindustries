import type {
	ModelConfig,
	ZoneScheme,
	ZoneTints,
} from "@sushindustries/product-viewer";
import type { ReactNode, RefObject } from "react";
import type { Group } from "three";
import type { GLTF } from "three-stdlib";
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
	 * No background node and an alpha drawing buffer, so the page shows through.
	 *
	 * The default clears to `--pv-canvas-bg`, which is right for a product on a
	 * card: the model needs a ground to sit on and a rectangle is honest about
	 * where the viewer ends. It is wrong for a mark in a hero, where that
	 * rectangle is the only thing announcing a canvas is there at all.
	 *
	 * It also withholds the loading scrim, which is the same rectangle arriving
	 * a second time while the model loads.
	 */
	transparent?: boolean;

	/**
	 * The group holding the model, so something outside can move it.
	 *
	 * A ref rather than a `rotation` prop on purpose. Anything driving this is
	 * doing so per frame - a scroll position, a pointer, a clock - and a prop
	 * would re-render the whole viewer sixty times a second to change a number
	 * React does not need to know about. Write to `ref.current.rotation.y` and
	 * the render loop picks it up.
	 *
	 * Orbit controls still own the camera, so turning the model this way and
	 * dragging to look at it compose rather than fight.
	 */
	modelRef?: RefObject<Group | null>;

	/**
	 * Orbit controls, and the click underneath them. @default true
	 *
	 * On by default: a product is a thing people turn over. Off makes this a
	 * picture that happens to be lit in real time, which is what it has to be
	 * anywhere the canvas sits inside something else that is clickable - a
	 * button, a link, a desktop icon. Orbit controls attach a pointerdown
	 * listener to the canvas, so a viewer inside a button is a button that
	 * cannot be pressed, and nothing about the markup says why.
	 */
	controls?: boolean;

	/**
	 * The contact shadow under the model. @default true
	 *
	 * Worth turning off below roughly a hundred pixels: it is a second render
	 * target, it is re-baked every frame when `modelRef` is set, and at icon
	 * size the whole shadow is about four pixels of grey.
	 */
	shadows?: boolean;

	/**
	 * Frame the camera to the model rather than to a fixed position.
	 *
	 * The default camera is placed for a landscape canvas, and `fov` is
	 * *vertical* - so on a square canvas the horizontal field of view is much
	 * narrower and the same model overflows the frame. That is not a wrong
	 * camera, it is a camera with an aspect ratio baked into it.
	 *
	 * Turn this on anywhere the shape of the box is not known in advance: a
	 * square icon, a card that reflows, a panel somebody resizes.
	 */
	fit?: boolean;

	/**
	 * Where the origin sits inside the model, and what a rotation turns around.
	 * @default "base"
	 *
	 * `base` rests it on y=0 so contact shadows and the grid land where the
	 * object meets the ground. `center` puts the origin at the middle of the
	 * bounding box.
	 *
	 * Anything driving `modelRef` wants `center`: with the base on y=0 the mass
	 * sits entirely above the axis, so a Y rotation swings the object around the
	 * origin like a fairground ride instead of turning it on the spot.
	 */
	pivot?: "base" | "center";

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
