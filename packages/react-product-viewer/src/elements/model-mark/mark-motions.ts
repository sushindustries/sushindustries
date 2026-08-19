import type { Euler } from "three";

/**
 * The named ways a mark can move.
 *
 * A closed union rather than a callback, because these are the four things
 * anybody actually wants and a union can be a `data-` attribute, a Markdown
 * table, a story, and a prop somebody discovers by autocomplete. `custom` is
 * the escape hatch for the fifth thing.
 */
export type MarkMotion = "spin" | "sway" | "tumble" | "still";

/**
 * A motion, as a pure function of elapsed seconds.
 *
 * Pure and time-based, and both halves matter.
 *
 * **Pure** means these are testable, composable and reusable without a canvas -
 * `spin(2)` is a number you can assert on. A motion that mutated an object
 * could only be checked by rendering one.
 *
 * **Time-based** rather than frame-based means a dropped frame loses nothing
 * and a backgrounded tab does not come back a quarter turn behind. The failure
 * mode of `rotation.y += 0.01` is invisible until somebody switches away and
 * back, which is the worst kind of invisible.
 */
export type MarkMotionFn = (
	/** Seconds since the motion started. */
	seconds: number,
	/** Seconds per cycle, from the `seconds` prop. */
	period: number,
) => { x: number; y: number; z: number };

const TAU = Math.PI * 2;

/** How far through the current cycle, 0 to 1. */
function phase(seconds: number, period: number): number {
	return (seconds / period) % 1;
}

export const MARK_MOTIONS: Readonly<Record<MarkMotion, MarkMotionFn>> = {
	/*
	 * One axis, constant speed. The default, and the only one that reads as a
	 * thing on a shelf rather than as an animation.
	 */
	spin: (seconds, period) => ({
		x: 0,
		y: phase(seconds, period) * TAU,
		z: 0,
	}),

	/*
	 * Turns to face, overshoots slightly, comes back. It never completes a
	 * revolution, so the front of the mark is always more or less towards the
	 * reader - which is what you want when the mark has a front, and a spin does
	 * not: a logo spends half of every revolution edge-on and unreadable.
	 *
	 * A quarter turn each way is enough to read as three-dimensional and little
	 * enough that nothing goes past its own silhouette.
	 */
	sway: (seconds, period) => ({
		x: Math.sin(phase(seconds, period) * TAU) * 0.08,
		y: Math.sin(phase(seconds, period) * TAU) * (TAU / 8),
		z: 0,
	}),

	/*
	 * Two axes at different rates, so it never repeats the same silhouette
	 * twice in a row. For a mark with no front - a solid, a knot, a die.
	 *
	 * The 0.6 is deliberately not a simple fraction: at 0.5 the two axes
	 * resynchronise every other cycle and the whole thing visibly loops.
	 */
	tumble: (seconds, period) => ({
		x: phase(seconds, period * 1.6) * TAU,
		y: phase(seconds, period) * TAU,
		z: 0,
	}),

	/*
	 * Held at a three-quarter view: enough of an angle to be obviously a model
	 * rather than a picture, and no motion at all.
	 *
	 * Not the same as passing no motion. This still mounts a canvas and still
	 * lights the object in real time; it simply does not move. It is what a
	 * reduced-motion reader gets if the caller has decided a canvas is worth it,
	 * and it is a legitimate resting state on its own.
	 */
	still: () => ({ x: 0.1, y: -TAU / 8, z: 0 }),
};

/** Write a motion onto a three `Euler`, in place. */
export function applyMotion(
	rotation: Euler,
	motion: MarkMotion,
	seconds: number,
	period: number,
): void {
	const next = MARK_MOTIONS[motion](seconds, period);

	rotation.x = next.x;
	rotation.y = next.y;
	rotation.z = next.z;
}
