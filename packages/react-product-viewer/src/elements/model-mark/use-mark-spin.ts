import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import { applyMotion, type MarkMotion } from "./mark-motions";

export interface MarkSpin {
	/** Hand to `modelRef`. Written to per frame, never through state. */
	readonly modelRef: RefObject<Group | null>;
	/** False until a canvas should exist at all. */
	readonly live: boolean;
}

/**
 * A model turning on a clock, and whether there should be one.
 *
 * Two decisions, and they belong together because the second one is the reason
 * the first is safe.
 *
 * **Nothing mounts on the server.** `lazy` is not enough on its own: React will
 * resolve a lazy import during SSR and render what comes back, and what comes
 * back here reaches for a WebGL renderer that does not exist. The first client
 * render matches the server's because this starts false, so hydration is quiet
 * and the canvas arrives on the effect after it.
 *
 * **Reduced motion means no canvas, not a still one.** A stationary model at
 * icon size is a worse version of the glyph already underneath it, and it costs
 * a WebGL context to be worse.
 *
 * The rotation is written straight onto the group. That is what `modelRef` is
 * for: a `rotation` prop would re-render the whole viewer sixty times a second
 * to change one float React has no reason to know about, and three reads the
 * matrix on its next frame either way.
 *
 * *What* it writes comes from `MARK_MOTIONS`, which are pure functions of
 * elapsed seconds - so a motion can be tested, swapped or composed without a
 * canvas anywhere near it.
 */
export function useMarkSpin(
	seconds: number,
	spinAnyway: boolean,
	motion: MarkMotion = "spin",
): MarkSpin {
	const modelRef = useRef<Group>(null);
	const [live, setLive] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

		/*
		 * `still` is exempt, because it does not move.
		 *
		 * Reduced motion is a request about movement, not about canvases, so a
		 * mark whose motion is `still` is not covered by it and there is nothing
		 * to withhold. Treating it as motion would mean the one variant that
		 * already honours the preference is also the one it disables.
		 */
		if (reduced.matches && !spinAnyway && motion !== "still") return;

		setLive(true);
	}, [spinAnyway, motion]);

	useEffect(() => {
		if (!live) return;

		let frame = 0;
		const started = performance.now();

		/*
		 * Driven by elapsed time rather than by a per-frame increment. A dropped
		 * frame then loses no rotation, and a tab that was in the background does
		 * not come back a quarter turn behind where it should be - which is what
		 * `rotation.y += 0.01` does, and it is invisible until somebody switches
		 * away and back.
		 */
		function tick(now: number): void {
			const group = modelRef.current;
			if (group) {
				applyMotion(group.rotation, motion, (now - started) / 1000, seconds);
			}

			frame = requestAnimationFrame(tick);
		}

		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [live, seconds, motion]);

	return { modelRef, live };
}
