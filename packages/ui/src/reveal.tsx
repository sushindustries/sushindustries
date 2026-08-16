import { type ReactNode, useEffect, useRef, useState } from "react";

export interface RevealProps {
	children: ReactNode;
	/** Stagger within a section, in milliseconds. */
	delay?: number;
}

/*
 * Fade-and-rise once, when the element first reaches the viewport.
 *
 * The server and the first client render both emit the hidden state, so
 * hydration matches; the observer then flips it. That ordering matters —
 * deciding visibility from scroll position during render would differ between
 * server and browser and produce a hydration mismatch on every reload that
 * starts part-way down the page.
 *
 * It never un-reveals. Content that fades back out as you scroll up reads as a
 * bug rather than as motion.
 */
export function Reveal({ children, delay = 0 }: RevealProps): ReactNode {
	const ref = useRef<HTMLDivElement>(null);
	const [shown, setShown] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setShown(true);
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setShown(true);
						observer.disconnect();
					}
				}
			},
			{ rootMargin: "0px 0px -10% 0px" },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			data-reveal={shown ? "in" : "out"}
			style={{ transitionDelay: `${delay}ms` }}
		>
			{children}
		</div>
	);
}
