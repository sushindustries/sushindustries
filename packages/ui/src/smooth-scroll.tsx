import Lenis from "lenis";
import { useEffect } from "react";

/*
 * Lenis owns the page scroll. It renders nothing - it exists so the effect has
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

		/*
		 * The scroll veil. An iframe or a canvas swallows the wheel events that
		 * pass over it, and Lenis loses its stream mid-gesture - which is the
		 * flutter every page full of live previews had. While a scroll is in
		 * flight the document carries `data-scrolling`, and the stylesheet turns
		 * embedded surfaces `pointer-events: none` for exactly that long, so the
		 * gesture stays whole and the previews are interactive again the moment
		 * the page settles.
		 */
		let settle = 0;
		const veil = (): void => {
			document.documentElement.setAttribute("data-scrolling", "");
			window.clearTimeout(settle);
			settle = window.setTimeout(() => {
				document.documentElement.removeAttribute("data-scrolling");
			}, 150);
		};
		lenis.on("scroll", veil);

		let frame = 0;
		function raf(time: number): void {
			lenis.raf(time);
			frame = requestAnimationFrame(raf);
		}
		frame = requestAnimationFrame(raf);

		return () => {
			cancelAnimationFrame(frame);
			window.clearTimeout(settle);
			document.documentElement.removeAttribute("data-scrolling");
			lenis.destroy();
		};
	}, []);

	return null;
}
