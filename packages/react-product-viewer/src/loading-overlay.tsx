import { useProgress } from "@react-three/drei";
import type { ReactElement, ReactNode } from "react";

/**
 * What sits between a click and a multi-megabyte download finishing.
 *
 * It has to read as progress rather than as a hang, which is the whole job.
 *
 * Styled with inline styles and CSS custom properties, deliberately. The first
 * version used Tailwind utility classes with shadcn's token names -
 * `bg-background/60`, `stroke-primary`, `text-muted-foreground` - which is
 * correct for a component you copy into a project that already has both, and
 * silently broken for one installed from npm: the classes resolve to nothing,
 * the overlay renders as unstyled markup over the canvas, and there is no error
 * anywhere to explain it.
 *
 * So: no stylesheet is required, no class names are assumed, and anything you
 * dislike is replaceable through the `loadingOverlay` prop.
 */

export interface LoadingOverlayProps {
	/** 0-100. */
	progress: number;
	/** Whether anything is still in flight. */
	active: boolean;
	label: string;
}

/** What `ProductViewer` accepts for `loadingOverlay`. */
export type LoadingOverlayRenderer = (
	props: LoadingOverlayProps,
) => ReactNode | null;

const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DefaultLoadingOverlay({
	progress,
	active,
	label,
}: LoadingOverlayProps): ReactElement | null {
	if (!active && progress >= 100) return null;

	const pct = Math.round(progress);

	return (
		<div className="pv-progress">
			<svg
				width="88"
				height="88"
				viewBox="0 0 88 88"
				role="img"
				aria-label={`${label} ${pct}%`}
			>
				<title>{`${label} ${pct}%`}</title>
				<circle
					className="pv-progress__track"
					cx="44"
					cy="44"
					r={RADIUS}
					fill="none"
					strokeWidth="7"
				/>
				<circle
					className="pv-progress__bar"
					cx="44"
					cy="44"
					r={RADIUS}
					fill="none"
					strokeWidth="7"
					strokeLinecap="round"
					strokeDasharray={CIRCUMFERENCE}
					// A value, not a decision: it changes every frame and cannot live
					// in a stylesheet. The colour and the easing both do.
					strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
					transform="rotate(-90 44 44)"
				/>
				<text className="pv-progress__value" x="44" y="49" textAnchor="middle">
					{pct}%
				</text>
			</svg>
			<p className="pv-progress__label">{label}</p>
		</div>
	);
}

/**
 * Subscribes to drei's loader progress and hands it to whichever overlay is in
 * use.
 *
 * Split from the overlay itself so a custom one is a pure function of its props
 * - testable, and renderable in a story without a loader running.
 */
export function LoadingOverlay({
	label,
	render,
}: {
	label: string;
	render: LoadingOverlayRenderer;
}): ReactElement | null {
	const { active, progress } = useProgress();
	return <>{render({ progress, active, label })}</>;
}
