import { type RefObject, useEffect } from "react";

export interface ScrollProgressOptions {
	/**
	 * Where in the viewport progress reaches 1, as a fraction of viewport
	 * height measured from the bottom.
	 *
	 * 0.5 means "fully open by the time the element's top reaches the middle of
	 * the screen". Finishing before the element is centred matters: an
	 * animation that completes exactly when you arrive was never seen
	 * completing.
	 */
	finishAt?: number;
	/** Ignore updates while the element is off screen. */
	whenVisible?: boolean;
}

/**
 * How far an element has travelled through the viewport, from 0 to 1.
 *
 * Different question from `useScrollTurn`, which asks how far the *page* has
 * scrolled. This one is about one element: it reads 0 while the element is
 * still below the fold and 1 once it has risen to `finishAt`, which is what
 * you want for anything that should play as a thing arrives rather than
 * continuously as the page moves.
 *
 * The callback runs in a `requestAnimationFrame` and is expected to write
 * somewhere directly, for the same reason as `useScrollTurn`: sixty state
 * updates a second re-render a subtree sixty times a second.
 *
 * An IntersectionObserver gates the listener rather than driving the value.
 * Observers report crossings, not positions, so they cannot give a smooth
 * progress - but they are the cheapest possible way to stop measuring an
 * element nobody can see.
 */
export function useScrollProgress(
	ref: RefObject<HTMLElement | null>,
	onProgress: (progress: number) => void,
	{ finishAt = 0.55, whenVisible = true }: ScrollProgressOptions = {},
): void {
	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		let frame = 0;
		let visible = !whenVisible;

		function measure(): number {
			if (!node) return 0;

			const rect = node.getBoundingClientRect();
			const height = window.innerHeight;

			/*
			 * 0 when the element's top is at the bottom of the screen, 1 when it
			 * has reached `finishAt`. Clamped at both ends, so scrolling past does
			 * not keep driving whatever this feeds.
			 */
			const travelled = height - rect.top;
			const distance = height * (1 - finishAt);

			return Math.min(1, Math.max(0, travelled / distance));
		}

		function apply(): void {
			frame = 0;
			onProgress(measure());
		}

		function onScroll(): void {
			if (!visible || frame) return;
			frame = requestAnimationFrame(apply);
		}

		/*
		 * Reduced motion gets the finished state, not the starting one. A lid
		 * frozen shut is a laptop nobody can read the screen of; the preference
		 * asks for less movement, not less content.
		 */
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			onProgress(1);
			return;
		}

		const observer =
			whenVisible && typeof IntersectionObserver !== "undefined"
				? new IntersectionObserver(
						([entry]) => {
							visible = entry?.isIntersecting ?? false;
							if (visible) apply();
						},
						{ rootMargin: "20% 0px" },
					)
				: null;

		observer?.observe(node);
		apply();

		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });

		return () => {
			if (frame) cancelAnimationFrame(frame);
			observer?.disconnect();
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		};
	}, [ref, onProgress, finishAt, whenVisible]);
}
