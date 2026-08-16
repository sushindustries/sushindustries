import { useScrollTurn } from "@sushindustries/ui";
import {
	lazy,
	type ReactNode,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import type { Group } from "three";
import { LOGO_MODEL } from "./logo";

/*
 * What the stage holds before the canvas exists.
 *
 * Not a logo, and it does not claim to be one. It has no title and no label
 * and is hidden from assistive technology, because the thing it stands in for
 * is a picture of a mark and a wrong mark is worse than none - the previous
 * version of this file was an SVG captioned "Sushindustries" that was not the
 * Sushindustries logo.
 *
 * It exists at all so the stage has something in it at the size the canvas
 * will be, and the swap is a material change rather than a layout one.
 */
function StagePlaceholder(): ReactNode {
	return (
		<div className="logo-placeholder" aria-hidden="true">
			<span className="label">Loading the mark</span>
		</div>
	);
}

/*
 * The logo, as the GLB it actually is, turning with the page scroll.
 *
 * Lazy and default-imported, because three and R3F are roughly 600 kB that
 * cannot run on a server. `lazy` alone is not enough on its own here - it is
 * enough only because nothing else in the module graph imports the viewer
 * eagerly - and the package is a default export specifically so this works.
 *
 * The fallback holds the stage at the size the canvas will be, so the arrival
 * of the model is a material change rather than a layout one.
 */
const ProductViewer = lazy(
	() => import("@sushindustries/react-product-viewer"),
);

export interface LogoModelProps {
	/** Viewport heights per full revolution. Higher is slower. */
	revolutions?: number;
	/** Degrees of wobble on the X axis. */
	tilt?: number;
}

function SpinningViewer({ revolutions, tilt }: LogoModelProps): ReactNode {
	const modelRef = useRef<Group>(null);

	/*
	 * Written straight onto the object, never through state.
	 *
	 * This is the reason the viewer takes a ref rather than a `rotation` prop:
	 * a prop would re-render the entire viewer sixty times a second to change
	 * one float that React has no reason to know about. three reads the matrix
	 * on the next frame either way.
	 *
	 * `ScrollSpin` writes a CSS transform from the same measurement. It cannot
	 * be used here - a CSS `rotateY` on a canvas spins the rendered image like
	 * a photograph rather than turning the model - but both should agree on how
	 * far a screenful of scrolling turns something, which is what sharing
	 * `useScrollTurn` buys.
	 */
	const turn = useCallback(
		({ turn, wobble }: { turn: number; wobble: number }) => {
			const group = modelRef.current;
			if (!group) return;

			group.rotation.y = turn * Math.PI * 2;
			group.rotation.x = (wobble * Math.PI) / 180;
		},
		[],
	);

	useScrollTurn(turn, { revolutions, tilt });

	return (
		<ProductViewer
			model={LOGO_MODEL}
			modelRef={modelRef}
			// Drawn on the page, not on a canvas. A hero mark with a rectangle
			// behind it announces that there is a canvas there, which is the one
			// thing this should not do.
			transparent
			// It is a mark, not a product on a floor: no grid, no shadow plate
			// implied by ground, and free to be looked at from underneath.
			groundBound={false}
			loadingLabel="Loading the mark"
		/>
	);
}

export function LogoModel({
	revolutions = 2,
	tilt = 8,
}: LogoModelProps): ReactNode {
	/*
	 * Client only, and `lazy` is not enough on its own to make it so.
	 *
	 * React will happily resolve a lazy import during SSR and render what comes
	 * back, and what comes back here is a WebGL canvas: R3F's `CanvasImpl` calls
	 * hooks and reaches for a renderer that does not exist on a server, and the
	 * whole stream falls over. This gate is what keeps the first render to
	 * markup a server can produce.
	 *
	 * The first client render matches the server's for the same reason - the
	 * state starts false - so hydration is quiet, and the canvas arrives on the
	 * effect afterwards.
	 */
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	return (
		<div className="logo-stage">
			{mounted ? (
				<Suspense fallback={<StagePlaceholder />}>
					<SpinningViewer revolutions={revolutions} tilt={tilt} />
				</Suspense>
			) : (
				<StagePlaceholder />
			)}
		</div>
	);
}
