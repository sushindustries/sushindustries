import { Bounds, ContactShadows, Grid, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { PMREMGenerator } from "three";
import { RoomEnvironment } from "three-stdlib";
import { ProductModel } from "../../product-model";
import { DefaultLoadingOverlay, LoadingOverlay } from "../../loading-overlay";
import { useScrollMode } from "./use-scroll-mode";
import type { ModelViewerProps } from "./model-viewer.types";
import type { ZoneScheme } from "@sushindustries/product-viewer";
import type { ReactElement, ReactNode, RefObject } from "react";

/**
 * The canvas, and nothing else.
 *
 * No chrome, no controls, no copy. Give it a size and it fills it; everything
 * that goes over or beside it belongs to whoever composed the page. That is
 * what lets the same element be a hero, a card thumbnail and the contents of a
 * dialog without three implementations of orbiting a model.
 *
 * **Client-only island.** three and R3F are roughly 600 kB and none of it can
 * run on a server. Mount it from a route with `ssr: false` *and* through
 * `React.lazy` - both halves are needed, because lazy alone still pulls the
 * import into the server render graph. That is why this is also a default
 * export.
 */

const SNAPSHOT_MAX_DIMENSION = 640;

/** Used only until the host element reports a token. */
const FALLBACK = {
	bg: "#e9ecef",
	gridCell: "#8f9aa5",
	gridSection: "#4a90d9",
} as const;

/**
 * Reads a CSS custom property off the host element.
 *
 * A WebGL clear colour has to be a real colour - the renderer cannot resolve
 * `var(--pv-canvas-bg)` - so the alternative to this is hard-coding one
 * project's palette into every consumer's tree. Reading it at mount lets the
 * same file look right in a design system it has never seen, and the literal
 * only survives where the token is undefined.
 */
function useToken(
	host: RefObject<HTMLElement | null>,
	name: string,
	fallback: string,
): string {
	const [value, setValue] = useState(fallback);

	useEffect(() => {
		if (!host.current) return;
		const resolved = getComputedStyle(host.current)
			.getPropertyValue(name)
			.trim();
		if (resolved) setValue(resolved);
	}, [host, name]);

	return value;
}

/**
 * `Bounds`, or nothing at all.
 *
 * A component rather than a ternary at the call site, because `Bounds` mounts a
 * camera controller: putting it behind `fit ? <Bounds>…</Bounds> : <>…</>` would
 * remount the whole model subtree whenever `fit` changed, discarding the GLB's
 * materials and re-uploading its textures to the GPU.
 *
 * `clip` is deliberately off. It moves the near and far planes onto the object,
 * and a model being turned through `modelRef` sweeps outside the box that was
 * measured on mount - so its far corner would clip away mid-rotation.
 */
function Fitted({
	fit,
	children,
}: {
	fit: boolean;
	children: ReactNode;
}): ReactElement {
	if (!fit) return <>{children}</>;

	return (
		<Bounds fit observe margin={1.1}>
			{children}
		</Bounds>
	);
}

/** Procedural environment lighting. No HDRI fetch, no CDN dependency. */
function DefaultEnvironment(): null {
	const gl = useThree((state) => state.gl);
	const scene = useThree((state) => state.scene);
	const invalidate = useThree((state) => state.invalidate);

	useEffect(() => {
		const pmrem = new PMREMGenerator(gl);
		// Called without `new`: three-stdlib declares RoomEnvironment as a factory
		// returning a Scene, not a class. `new RoomEnvironment()` does work - JS
		// hands back the returned object - but it does not typecheck, and both
		// projects this was reconciled from carry that error today.
		const environment = pmrem.fromScene(RoomEnvironment(), 0.04).texture;
		scene.environment = environment;
		invalidate();
		return () => {
			scene.environment = null;
			environment.dispose();
			pmrem.dispose();
		};
	}, [gl, scene, invalidate]);

	return null;
}

/**
 * Exposes the current frame as a PNG data URL.
 *
 * Downscaled before encoding: at dpr 2 the raw buffer encodes to well over
 * 900 kB, which is a poor thing to put in a database row or an email.
 */
function SnapshotCapture({
	snapshotRef,
}: {
	snapshotRef: RefObject<(() => string) | null>;
}): null {
	const gl = useThree((state) => state.gl);

	useEffect(() => {
		snapshotRef.current = () => {
			const source = gl.domElement;
			const scale = Math.min(
				1,
				SNAPSHOT_MAX_DIMENSION / Math.max(source.width, source.height),
			);
			const width = Math.round(source.width * scale);
			const height = Math.round(source.height * scale);

			const resized = document.createElement("canvas");
			resized.width = width;
			resized.height = height;
			resized.getContext("2d")?.drawImage(source, 0, 0, width, height);
			return resized.toDataURL("image/png");
		};
		return () => {
			snapshotRef.current = null;
		};
	}, [gl, snapshotRef]);

	return null;
}

export function ModelViewer<S extends ZoneScheme = ZoneScheme>({
	model,
	gltf,
	variants,
	zoneScheme,
	zoneTints,
	scroll = "zoom",
	transparent = false,
	environment,
	grid = false,
	groundBound = true,
	snapshotRef,
	modelRef,
	controls = true,
	shadows = true,
	fit = false,
	pivot = "base",
	loadingLabel = "Loading model…",
	loadingOverlay = DefaultLoadingOverlay,
	scrollHint = "Hold ⌘ or Ctrl to zoom",
	className,
	children,
}: ModelViewerProps<S>): ReactElement {
	const hostRef = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(true);
	const { enableZoom, hinting, preventSmoothScroll } = useScrollMode(
		scroll,
		hostRef,
	);

	const background = useToken(hostRef, "--pv-canvas-bg", FALLBACK.bg);
	const gridCell = useToken(hostRef, "--pv-grid-cell", FALLBACK.gridCell);
	const gridSection = useToken(
		hostRef,
		"--pv-grid-section",
		FALLBACK.gridSection,
	);

	// `frameloop="demand"` renders nothing at all on cold mount under R3F v9, so
	// this stays on "always" - but "always" alone keeps the GPU busy while someone
	// reads the page far below the canvas. Pausing the loop when the canvas leaves
	// the viewport keeps the mode that works without the cost.
	//
	// Both projects this came from hit the demand bug independently and each wrote
	// its own note about it. That is the sort of thing a package is for.
	useEffect(() => {
		const host = hostRef.current;
		if (!host || typeof IntersectionObserver === "undefined") return;
		const observer = new IntersectionObserver(
			([entry]) => setVisible(entry?.isIntersecting ?? true),
			{ rootMargin: "200px" },
		);
		observer.observe(host);
		return () => observer.disconnect();
	}, []);

	// Scene units follow the model: with realLength the scene is in the caller's
	// unit and a grid square means something; without it everything is relative to
	// a roughly two-unit object.
	const size = model.realLength ?? 2;

	return (
		<div
			ref={hostRef}
			data-scroll={scroll}
			// Smooth-scroll libraries hijack the wheel document-wide. In `zoom` mode
			// that makes the model zoom while the page glides underneath it; in the
			// other two modes the hijacking is the behaviour we want, so the marker
			// would be actively wrong.
			{...(preventSmoothScroll ? { "data-lenis-prevent": "" } : {})}
			className={["pv-viewer", className].filter(Boolean).join(" ")}
			// Without controls there is nothing here to point at, so every pointer
			// event belongs to whatever this is sitting inside. A canvas that eats
			// the click of the button around it is the failure this prevents.
			data-controls={controls ? "true" : "false"}
			// The loading scrim reads this. A transparent viewer is drawn *on the
			// page*, and a scrim is precisely the rectangle that arrangement
			// exists to avoid - so it must not paint one while the model arrives.
			data-transparent={transparent ? "true" : "false"}
		>
			<Canvas
				frameloop={visible ? "always" : "never"}
				dpr={[1, 2]}
				camera={{
					position: [size * 1.05, size * 0.65, size * 1.3],
					fov: 40,
					near: size * 0.01,
					far: size * 50,
				}}
				gl={{
					antialias: true,
					powerPreference: "high-performance",
					// Without this the drawing buffer may be cleared before toDataURL runs
					// and the snapshot comes back blank. It costs a buffer copy, so only
					// when a snapshot is actually wanted.
					preserveDrawingBuffer: Boolean(snapshotRef),
					alpha: transparent,
				}}
			>
				{transparent ? null : (
					<color attach="background" args={[background]} />
				)}
				{environment ?? <DefaultEnvironment />}
				{snapshotRef ? <SnapshotCapture snapshotRef={snapshotRef} /> : null}

				<ambientLight intensity={0.35} />
				<directionalLight
					position={[size * 2, size * 3, size * 1.5]}
					intensity={1.2}
				/>

				<Suspense fallback={null}>
					{/*
						Always wrapped in a group, whether or not anyone asked for the
						ref. A group with no transform costs one matrix multiply and
						keeps the scene graph the same shape in both cases, which is
						worth more than the multiply.
					*/}
					<Fitted fit={fit}>
						<group ref={modelRef}>
							<ProductModel
								model={model}
								gltf={gltf}
								variants={variants}
								zoneScheme={zoneScheme}
								zoneTints={zoneTints}
								pivot={pivot}
							/>
						</group>
					</Fitted>

					{shadows ? (
						<ContactShadows
							opacity={0.35}
							scale={size * 3.5}
							blur={2.4}
							far={size * 1.2}
							// Baked once for a model that never moves, which is the
							// cheapest thing here to delete - but a model somebody is
							// driving through `modelRef` does move, and a shadow frozen on
							// frame one under a turning object is more obviously wrong
							// than no shadow at all.
							frames={modelRef ? Infinity : 1}
						/>
					) : null}
					{children}
				</Suspense>

				{grid ? (
					<Grid
						position={[0, 0.01, 0]}
						cellSize={1}
						cellThickness={0.6}
						cellColor={gridCell}
						sectionSize={5}
						sectionThickness={1.2}
						sectionColor={gridSection}
						infiniteGrid
						fadeDistance={size * 6}
						fadeStrength={1.5}
					/>
				) : null}

				{controls ? (
					<OrbitControls
						makeDefault
						target={[0, size * 0.22, 0]}
						enablePan={false}
						enableZoom={enableZoom}
						minPolarAngle={groundBound ? 0.15 : 0}
						maxPolarAngle={groundBound ? Math.PI / 2 - 0.05 : Math.PI}
						minDistance={size * 0.45}
						maxDistance={size * 3}
						enableDamping
						dampingFactor={0.08}
					/>
				) : null}
			</Canvas>

			{/*
        No overlay when the asset was handed in. `useProgress` reports drei's
        loader, and with TanStack Query owning the fetch that loader never runs
        - so it reports `active: false, progress: 0` forever and a progress ring
        sits at 0% over a model that is already on screen. Whoever owns the
        loading owns showing its progress.
      */}
			{gltf ? null : (
				<LoadingOverlay label={loadingLabel} render={loadingOverlay} />
			)}

			{scrollHint && scroll === "modifier" ? (
				<div className="pv-viewer__hint" data-visible={hinting || undefined}>
					{scrollHint}
				</div>
			) : null}
		</div>
	);
}

export default ModelViewer;
