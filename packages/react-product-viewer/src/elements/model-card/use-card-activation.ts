import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { ModelCardActivation } from "./model-card.types";

/**
 * Decides when a card is a picture and when it is a running scene.
 *
 * The entire job is rationing WebGL contexts. A browser keeps about sixteen
 * before it starts discarding the oldest without telling anyone, and the
 * symptom is not slowness - it is cards that go black on scroll and come back
 * with their materials gone. So each mode below is written to hold the smallest
 * number of live contexts that still does what it promises.
 */

/** Grace period before a hovered card gives its context back. */
const HOVER_RELEASE_MS = 400;

/**
 * Whether this device has a pointer that can hover.
 *
 * `pointerenter` fires on a touch tap as well as on a mouse, so without this
 * check `hover` mode would activate on the very tap that opens the product
 * page - spending a WebGL context on a card the visitor is in the act of
 * leaving, on exactly the devices least able to afford one.
 */
function canHover(): boolean {
	return (
		typeof window !== "undefined" &&
		window.matchMedia("(hover: hover) and (pointer: fine)").matches
	);
}

interface CardActivation {
	active: boolean;
	/** Spread onto the card's visual area. */
	hostProps: {
		onPointerEnter?: () => void;
		onPointerLeave?: () => void;
	};
	/** Call from the poster's own control, for `press`. */
	activate: () => void;
}

export function useCardActivation(
	mode: ModelCardActivation,
	host: RefObject<HTMLElement | null>,
): CardActivation {
	const [active, setActive] = useState(false);
	const releaseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	const activate = useCallback(() => {
		clearTimeout(releaseTimer.current);
		setActive(true);
	}, []);

	// `visible` is the only mode the card drives itself, and it deactivates on
	// the way out as well as activating on the way in. That is what keeps the
	// live count proportional to the viewport rather than to the scroll depth:
	// without the release, scrolling a long grid activates every card it passes
	// and none of them ever stop.
	useEffect(() => {
		const element = host.current;
		if (
			mode !== "visible" ||
			!element ||
			typeof IntersectionObserver === "undefined"
		) {
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => setActive(entry?.isIntersecting ?? false),
			{ rootMargin: "100px" },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [mode, host]);

	useEffect(() => () => clearTimeout(releaseTimer.current), []);

	if (mode === "hover") {
		return {
			active,
			activate,
			hostProps: {
				onPointerEnter: () => {
					if (canHover()) activate();
				},
				// Released on the way out, but not instantly. Dragging the pointer
				// across a row of cards would otherwise mount and tear down a WebGL
				// context per card in a few hundred milliseconds, which stutters far
				// worse than the thing it was trying to make feel responsive.
				onPointerLeave: () => {
					clearTimeout(releaseTimer.current);
					releaseTimer.current = setTimeout(
						() => setActive(false),
						HOVER_RELEASE_MS,
					);
				},
			},
		};
	}

	return { active: mode === "never" ? false : active, activate, hostProps: {} };
}
