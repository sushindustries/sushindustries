import Lenis from "lenis";
import { useEffect } from "react";

/*
 * Lenis owns the page scroll. It renders nothing — it exists so the effect has
 * somewhere to live inside the root document.
 *
 * Mounting in an effect rather than at module scope is deliberate: Lenis
 * touches `window` and `document` immediately, and the root component also
 * renders on the server. Anyone who reduces motion gets the native scroll,
 * which is the correct smooth scroll for them.
 */
export function SmoothScroll(): null {
	useEffect(() => {
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (reduced.matches) return;

		const lenis = new Lenis({
			duration: 1.1,
			smoothWheel: true,
		});

		let frame = 0;
		function raf(time: number): void {
			lenis.raf(time);
			frame = requestAnimationFrame(raf);
		}
		frame = requestAnimationFrame(raf);

		return () => {
			cancelAnimationFrame(frame);
			lenis.destroy();
		};
	}, []);

	return null;
}
