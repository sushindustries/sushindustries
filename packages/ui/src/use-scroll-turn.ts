import { useEffect } from "react";

export interface ScrollTurn {
	/** Full revolutions scrolled so far. 0.5 is half a turn. */
	readonly turn: number;
	/** A gentle oscillation, in degrees, for a wobble on a second axis. */
	readonly wobble: number;
}

export interface ScrollTurnOptions {
	/**
	 * Viewport heights per full revolution. Higher is slower.
	 *
	 * Tied to viewport height rather than to pixels, so the rotation per screen
	 * scrolled is the same on a phone and on a monitor. In pixels, a phone would
	 * spin four times over the same content a desktop turns once.
	 */
	revolutions?: number;
	/** Amplitude of the wobble, in degrees. Zero for a flat turntable. */
	tilt?: number;
}

/**
 * Scroll position as a rotation, delivered once per frame.
 *
 * The callback runs inside `requestAnimationFrame` and is expected to write
 * somewhere directly - a DOM node's transform, a three.js object's rotation.
 * Nothing here holds state, because at 60fps a state-driven version re-renders
 * its subtree on every frame of every scroll, which is the one reliable way to
 * make a light page feel heavy.
 *
 * A plain passive scroll listener rather than a Lenis subscription, so this
 * works with or without smooth scrolling: when Lenis is mounted it is already
 * driving the native scroll position, so `scrollY` is the smoothed value
 * either way, and when it is not this still works.
 *
 * Under `prefers-reduced-motion: reduce` the callback fires once, at the
 * current position, and never again. That leaves whatever it drives in a
 * sensible still state rather than at zero, which matters when zero is not a
 * pose anyone chose.
 */
export function useScrollTurn(
	onTurn: (value: ScrollTurn) => void,
	{ revolutions = 2, tilt = 8 }: ScrollTurnOptions = {},
): void {
	useEffect(() => {
		let frame = 0;

		function measure(): ScrollTurn {
			const turn = window.scrollY / (window.innerHeight * revolutions);
			return { turn, wobble: Math.sin(turn * Math.PI * 2) * tilt };
		}

		function apply(): void {
			frame = 0;
			onTurn(measure());
		}

		apply();

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		function onScroll(): void {
			if (frame) return;
			frame = requestAnimationFrame(apply);
		}

		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });

		return () => {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		};
	}, [onTurn, revolutions, tilt]);
}
