import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { ModelViewerScroll } from "./model-viewer.types";

/**
 * Decides the wheel, without letting React decide it.
 *
 * The obvious implementation - track whether a modifier is held in state and
 * pass `enableZoom={held}` - loses the race every time. A wheel event carries
 * its own modifier flags and arrives at the controls in the same tick; a state
 * update lands a render later, so the first notch of every gesture is handled
 * under the previous value. In practice that means the page jumps once before
 * zoom engages, on every single scroll.
 *
 * So the decision is made in the event, not in a render. `enableZoom` stays
 * true and a capture-phase listener on the host decides whether the controls
 * ever see the event at all. Capture matters: the controls listen on the canvas
 * below us, so capturing on the host runs first and `stopPropagation` is enough
 * to take the event away from them.
 */

/** How long the "hold to zoom" hint stays up after a bare scroll. */
const HINT_MS = 1400;

interface ScrollMode {
	/** Passed to OrbitControls. */
	enableZoom: boolean;
	/** True while the hint should be visible. */
	hinting: boolean;
	/**
	 * Whether to mark the host against smooth-scroll libraries.
	 *
	 * Lenis and friends hijack the wheel document-wide, which in `zoom` mode
	 * means the model zooms while the page glides underneath it. In `page` mode
	 * that hijacking is exactly what we want, so the marker is wrong there.
	 */
	preventSmoothScroll: boolean;
}

export function useScrollMode(
	mode: ModelViewerScroll,
	host: RefObject<HTMLElement | null>,
): ScrollMode {
	const [hinting, setHinting] = useState(false);
	const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	useEffect(() => {
		const element = host.current;
		if (mode !== "modifier" || !element) return;

		function onWheel(event: WheelEvent): void {
			// `metaKey` for macOS, `ctrlKey` for everywhere else and for the trackpad
			// pinch gesture, which browsers report as a ctrl-wheel.
			if (event.ctrlKey || event.metaKey) {
				// Without this the browser zooms the whole page instead, which is the
				// one outcome nobody wanted from either interpretation of the gesture.
				event.preventDefault();
				return;
			}

			// The controls never see it, so the document scrolls exactly as it would
			// if the viewer were an image. No `preventDefault` here: that is what
			// leaves the native scroll intact.
			event.stopPropagation();

			setHinting(true);
			clearTimeout(hintTimer.current);
			hintTimer.current = setTimeout(() => setHinting(false), HINT_MS);
		}

		// Capture, so this runs before the controls' own listener. Not passive,
		// because the modifier branch calls `preventDefault`.
		element.addEventListener("wheel", onWheel, {
			capture: true,
			passive: false,
		});
		return () => {
			element.removeEventListener("wheel", onWheel, { capture: true });
			clearTimeout(hintTimer.current);
		};
	}, [mode, host]);

	return {
		// `page` is the only mode that turns zoom off at the controls. `modifier`
		// leaves it on and filters the events instead, for the reason above.
		enableZoom: mode !== "page",
		hinting,
		preventSmoothScroll: mode === "zoom",
	};
}
