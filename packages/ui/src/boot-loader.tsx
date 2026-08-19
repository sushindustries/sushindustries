import { type ReactNode, useEffect, useRef, useState } from "react";

export interface BootLoaderProps {
	/** Drawn in the middle, above the counter. A spinning mark, usually. */
	children?: ReactNode;
	/** Roughly how long a full run takes, in milliseconds. */
	duration?: number;
	/**
	 * True once whatever this is waiting for has arrived.
	 *
	 * The count runs on its own and stalls near the end until this flips. That
	 * is the whole design: a progress bar that finishes before the thing it is
	 * measuring is a progress bar that lies, and one that only moves when real
	 * work reports in sits at zero for two seconds and looks broken.
	 */
	ready?: boolean;
	/** Called once the counter has reached a hundred and faded. */
	onDone?: () => void;
	/** Read out instead of the number, which is meaningless spoken. */
	label?: string;
}

/*
 * A machine booting: a mark, a number climbing to a hundred, and a rule.
 *
 * The count is **not** a measurement and does not pretend to be one. Nothing on
 * this page can report real progress - a GLB either has arrived or has not, and
 * a font either is or is not - so a number derived from bytes would jump from 0
 * to 100 with nothing in between and be worse than no number at all.
 *
 * What it does instead is honest in a different way: it eases towards 90 on a
 * timer, waits there for `ready`, then runs to 100. So the number is a promise
 * about *attention* rather than about bytes - it says something is happening
 * and roughly how long is left - and it can never claim to be finished while
 * the thing it is covering has not arrived.
 *
 * The stall is deliberately at 90 rather than 99. A counter parked on 99 reads
 * as stuck; one at 90 reads as nearly there, and the last tenth is where the
 * eye expects the pause anyway.
 */
export function BootLoader({
	children,
	duration = 1600,
	ready = true,
	onDone,
	label = "Loading",
}: BootLoaderProps): ReactNode {
	const [percent, setPercent] = useState(0);
	const [gone, setGone] = useState(false);

	/*
	 * `onDone` in a ref, so the animation is not restarted by a caller that
	 * happens to pass an inline arrow function - which is every caller. A
	 * dependency on the prop itself would tear down and rebuild the loop on
	 * every render of the parent, and the count would never advance.
	 */
	const done = useRef(onDone);
	done.current = onDone;

	useEffect(() => {
		/*
		 * Reduced motion drops the count and keeps the loader. Animating a
		 * number from nothing to a hundred is the flourish; "something is
		 * happening, and now it has arrived" is the information, and it still
		 * has to be delivered - a loader that respects the preference by
		 * showing nothing is a blank screen with a preference.
		 *
		 * So the number goes straight to where the animation would have
		 * stalled: 90 while waiting, 100 once `ready`, and the same beat
		 * before leaving so the finish is still seen.
		 */
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setPercent(ready ? 100 : 90);

			if (!ready) return;

			const beat = window.setTimeout(() => {
				setGone(true);
				done.current?.();
			}, 260);

			return () => window.clearTimeout(beat);
		}

		let frame = 0;
		const started = performance.now();

		function tick(now: number): void {
			const elapsed = (now - started) / duration;

			/*
			 * Eased out, so it moves fast at the start and settles at the end.
			 * Linear reads as a machine counting; this reads as something loading,
			 * and the difference is entirely in the last third.
			 */
			const eased = 1 - (1 - Math.min(1, elapsed)) ** 3;
			const ceiling = ready ? 100 : 90;
			const next = Math.min(ceiling, Math.round(eased * 100));

			setPercent((current) => (next > current ? next : current));

			if (next >= 100) {
				/*
				 * A beat at a hundred before leaving. Without it the number is
				 * replaced in the same frame it becomes correct, so nobody ever sees
				 * it finish - which is the one moment the whole component exists for.
				 */
				window.setTimeout(() => {
					setGone(true);
					done.current?.();
				}, 260);
				return;
			}

			frame = requestAnimationFrame(tick);
		}

		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [duration, ready]);

	if (gone) return null;

	return (
		/*
		 * `role="status"` and not `alert`. Something loading is not an
		 * interruption, and `aria-busy` is what actually says "wait" to a screen
		 * reader - the number is announced as a percentage or not at all, which
		 * is why the label carries the meaning.
		 */
		<div className="boot" role="status" aria-busy={percent < 100}>
			<div className="boot-stage">{children}</div>

			<p className="boot-count">
				<span className="sr-only">{label}</span>
				{/*
				 * `tabular-nums` in the stylesheet, so 8 and 88 are the same width
				 * and the number does not jitter sideways as it climbs. It is the
				 * single most noticeable thing about a counter that lacks it.
				 */}
				<span aria-hidden="true">{String(percent).padStart(3, "0")}</span>
			</p>

			{/*
			 * The rule is the same number again, as a length.
			 *
			 * Two encodings of one value, which is not redundancy: a number is read
			 * and a length is glanced at, and somebody waiting is doing the second
			 * one. `scaleX` rather than `width` so it composites without laying the
			 * page out sixty times a second.
			 */}
			<div className="boot-rail" aria-hidden="true">
				<div
					className="boot-fill"
					style={{ transform: `scaleX(${percent / 100})` }}
				/>
			</div>
		</div>
	);
}
