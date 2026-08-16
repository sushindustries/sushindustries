import type { ModelConfig } from "@sushindustries/product-viewer";
import type { CSSProperties, ReactNode } from "react";
import type { MarkMotion } from "./mark-motions";

export interface ModelMarkProps {
	model: ModelConfig;

	/**
	 * Drawn underneath the canvas, and never removed.
	 *
	 * A flat icon of the same thing, usually. It is not a placeholder that gets
	 * swapped out - it stays there, and the canvas paints over it - because WebGL
	 * is the one part of a page that can fail for reasons the page does not
	 * control: a driver, a context the browser refused, a machine with no GPU
	 * worth the name. Left as a fallback that is replaced on load, every one of
	 * those failures is a blank square. Left underneath, every one of them is an
	 * icon that does not spin.
	 *
	 * It is also what shows when the reader has asked for reduced motion, since
	 * no canvas is mounted at all in that case.
	 */
	glyph?: ReactNode;

	/** Seconds per cycle. Higher is slower. */
	seconds?: number;

	/**
	 * How it moves. See `MARK_MOTIONS`.
	 *
	 * | Motion | What it does | For |
	 * | --- | --- | --- |
	 * | `spin` | one axis, constant speed | the default. A thing on a shelf |
	 * | `sway` | turns to face, overshoots, returns | a mark with a *front*. A spin spends half of every revolution edge-on and unreadable |
	 * | `tumble` | two axes at rates that do not resynchronise | a mark with no front - a solid, a knot, a die |
	 * | `still` | held at a three-quarter view | a resting state, and what to pick when the canvas is worth it but the motion is not |
	 *
	 * They are pure functions of elapsed seconds, exported as `MARK_MOTIONS`, so
	 * a fifth one is a function rather than a fork of this element.
	 */
	motion?: MarkMotion;

	/**
	 * Turn even when the reader has asked for less motion.
	 *
	 * Off by default and it should stay off. A mark this size is decoration, and
	 * decoration is exactly what "reduce motion" is about - so the honest
	 * response is not a slower spin, it is the glyph and no canvas at all.
	 */
	spinAnyway?: boolean;

	/** Added after `pv-mark`. */
	className?: string;

	/**
	 * Inline style, which in practice means setting `--pv-mark-size`.
	 *
	 * The size is a custom property rather than a prop because it belongs to the
	 * stylesheet: a mark inside a media query, a container query, or a `clamp()`
	 * is the normal case, and a number prop can express none of those. This is
	 * the escape hatch for the one case where the size is genuinely a value the
	 * caller computed.
	 */
	style?: CSSProperties;

	/**
	 * What this is, for anyone who cannot see it.
	 *
	 * Required in practice: a mark with no name is an image with no alt text,
	 * and the canvas underneath contributes nothing to the accessibility tree.
	 */
	label?: string;
}
