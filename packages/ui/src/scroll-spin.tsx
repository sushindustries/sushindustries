import { type ReactNode, useEffect, useRef } from "react";

export interface ScrollSpinProps {
	/** Whatever should turn. A logo, a mark, an image, a diagram. */
	children: ReactNode;
	/**
	 * Viewport heights per full revolution. Higher is slower.
	 * Tied to viewport height rather than pixels so the rotation per "screen
	 * scrolled" is the same on a phone and on a monitor.
	 */
	revolutions?: number;
	/** Degrees of wobble on the X axis. Set to 0 for a flat turntable. */
	tilt?: number;
}

/*
 * Rotates its children with the page scroll.
 *
 * The transform is written straight onto the node inside a rAF callback rather
 * than held in React state. At 60fps a state-driven version re-renders the
 * subtree on every frame of every scroll, which is the one thing guaranteed to
 * make a light page feel heavy.
 *
 * A plain passive scroll listener is used rather than a Lenis subscription, so
 * this works with or without smooth scrolling: if Lenis is mounted it is
 * already driving the native scroll position, and `scrollY` is the smoothed
 * value either way.
 *
 * Anyone who reduces motion gets a still image.
 */
export function ScrollSpin({
	children,
	revolutions = 2,
	tilt = 8,
}: ScrollSpinProps): ReactNode {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		let frame = 0;

		function apply(): void {
			frame = 0;
			if (!node) return;

			const turn = window.scrollY / (window.innerHeight * revolutions);
			const wobble = Math.sin(turn * Math.PI * 2) * tilt;

			node.style.transform = `rotateX(${wobble}deg) rotateY(${turn * 360}deg)`;
		}

		function onScroll(): void {
			if (frame) return;
			frame = requestAnimationFrame(apply);
		}

		apply();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });

		return () => {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		};
	}, [revolutions, tilt]);

	return (
		<div className="logo-stage">
			<div ref={ref} className="logo-spin">
				{children}
			</div>
		</div>
	);
}
