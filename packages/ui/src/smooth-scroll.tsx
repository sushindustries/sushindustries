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
		/*
		 * Whether the veil is currently up, tracked here rather than read back
		 * off the element.
		 *
		 * Lenis emits `scroll` every frame it animates, and this handler used to
		 * write the attribute on every one of them - about 230 writes for a
		 * single flick of the wheel, where the attribute only ever changes
		 * twice. Each write dirties `:root`, and every rule keyed off
		 * `[data-scrolling]` gets its invalidation walk again for a value that
		 * did not change. Writing only on the edges makes it two.
		 */
		let veiled = false;
		const lower = (): void => {
			veiled = false;
			document.documentElement.removeAttribute("data-scrolling");
		};
		const veil = (): void => {
			if (!veiled) {
				veiled = true;
				document.documentElement.setAttribute("data-scrolling", "");
			}
			window.clearTimeout(settle);
			settle = window.setTimeout(lower, 150);
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
