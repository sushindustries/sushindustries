import { type ReactNode, useCallback, useRef } from "react";
import { type ScrollTurn, useScrollTurn } from "./use-scroll-turn";

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
 * The scroll-to-angle part is `useScrollTurn`, which is separate because the
 * same measurement drives two very different things: this writes a CSS
 * transform, and the site's hero writes a three.js object's rotation. A CSS
 * `rotateY` on a canvas would spin the rendered image like a photograph rather
 * than turning the model, so the 3D version has to reach into the scene - but
 * both should agree on how far a screenful of scrolling turns something.
 *
 * The transform is written straight onto the node rather than held in React
 * state. At 60fps a state-driven version re-renders the subtree on every frame
 * of every scroll, which is the one thing guaranteed to make a light page feel
 * heavy.
 *
 * Anyone who reduces motion gets a still image.
 */
export function ScrollSpin({
	children,
	revolutions = 2,
	tilt = 8,
}: ScrollSpinProps): ReactNode {
	const ref = useRef<HTMLDivElement>(null);

	const apply = useCallback(({ turn, wobble }: ScrollTurn) => {
		const node = ref.current;
		if (!node) return;

		node.style.transform = `rotateX(${wobble}deg) rotateY(${turn * 360}deg)`;
	}, []);

	useScrollTurn(apply, { revolutions, tilt });

	return (
		<div className="logo-stage">
			<div ref={ref} className="logo-spin">
				{children}
			</div>
		</div>
	);
}
