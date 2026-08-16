import { ContactShadows, Grid, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import { PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three-stdlib'
import type { GLTF } from 'three-stdlib'
import type { ReactElement, ReactNode, RefObject } from 'react'
import type {
  ModelConfig,
  ZoneScheme,
  ZoneTints,
} from '@sushindustries/product-viewer'
import { ProductModel } from './product-model'
import {
  DefaultLoadingOverlay,
  LoadingOverlay,
  type LoadingOverlayRenderer,
} from './loading-overlay'

/**
 * A GLB product viewer: orbit, ground shadow, material variants, snapshot.
 *
 * **Client-only island.** three and R3F are roughly 600 kB and none of it can
 * run on a server. Mount it from a route with `ssr: false` AND through
 * `React.lazy` - both halves are needed, because lazy alone still pulls the
 * import into the SSR graph. That is why this is also a default export.
 *
 * Deliberately ignorant of the domain above it. It takes a model, a list of
 * variant names and optional zone tints; it does not know what a "cladding
 * option" is, own selection state, or read a store. Pickers, hotspots and
 * pricing belong to the application and go in as `children`.
 */

const SNAPSHOT_MAX_DIMENSION = 640

/** Fallbacks, used only until the host element reports a token. */
const FALLBACK = {
  bg: '#e9ecef',
  gridCell: '#8f9aa5',
  gridSection: '#4a90d9',
} as const

/**
 * Reads a CSS custom property off the host element.
 *
 * A WebGL clear colour has to be a real colour - the renderer cannot resolve
 * `var(--bg)` - so the alternative to this is hard-coding one project's palette
 * into every consumer's tree. Reading it at mount lets the same file look right
 * in a design system it has never seen, and the literal only survives where the
 * token is undefined.
 */
function useToken(
  host: RefObject<HTMLElement | null>,
  name: string,
  fallback: string,
): string {
  const [value, setValue] = useState(fallback)

  useEffect(() => {
    if (!host.current) return
    const resolved = getComputedStyle(host.current)
      .getPropertyValue(name)
      .trim()
    if (resolved) setValue(resolved)
  }, [host, name])

  return value
}

/** Procedural environment lighting. No HDRI fetch, no CDN dependency. */
function DefaultEnvironment(): null {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    // Called without `new`: three-stdlib declares RoomEnvironment as a factory
    // returning a Scene, not a class. `new RoomEnvironment()` does work - JS
    // hands back the returned object - but it does not typecheck, and both
    // projects this was reconciled from carry that error today.
    const environment = pmrem.fromScene(RoomEnvironment(), 0.04).texture
    scene.environment = environment
    invalidate()
    return () => {
      scene.environment = null
      environment.dispose()
      pmrem.dispose()
    }
  }, [gl, scene, invalidate])

  return null
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
  snapshotRef: RefObject<(() => string) | null>
}): null {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    snapshotRef.current = () => {
      const source = gl.domElement
      const scale = Math.min(
        1,
        SNAPSHOT_MAX_DIMENSION / Math.max(source.width, source.height),
      )
      const width = Math.round(source.width * scale)
      const height = Math.round(source.height * scale)

      const resized = document.createElement('canvas')
      resized.width = width
      resized.height = height
      resized.getContext('2d')?.drawImage(source, 0, 0, width, height)
      return resized.toDataURL('image/png')
    }
    return () => {
      snapshotRef.current = null
    }
  }, [gl, snapshotRef])

  return null
}

export interface ProductViewerProps<S extends ZoneScheme = ZoneScheme> {
  model: ModelConfig
  /**
   * An already-loaded asset, for when something else owns the cache.
   *
   * Pass the data from `productModelOptions` and the GLB is fetched by the route
   * loader - on hover, under `defaultPreload: "intent"` - rather than on mount.
   */
  gltf?: GLTF
  /** GLB variant names to apply, in order. */
  variants?: readonly string[]
  /** The zones `zoneTints` is keyed by. Required alongside it. */
  zoneScheme?: S
  /** Per-zone colour multipliers, for single-mesh models. */
  zoneTints?: ZoneTints<S>
  /** Replaces the procedural room lighting. Pass a component, not a value. */
  environment?: ReactNode
  /** A one-unit grid on the floor. Only meaningful with `realLength` set. */
  grid?: boolean
  /**
   * Clamp the orbit above the horizon. True for anything that sits on the
   * ground; false for objects people pick up and look at from underneath.
   */
  groundBound?: boolean
  /** Set to capture the current frame as a PNG data URL. */
  snapshotRef?: RefObject<(() => string) | null>
  loadingLabel?: string
  /** Replaces the default progress overlay entirely. */
  loadingOverlay?: LoadingOverlayRenderer
  /** Added after `pv-viewer`. */
  className?: string
  /** Drawn inside the scene's Suspense boundary - hotspots, helpers. */
  children?: ReactNode
}

export function ProductViewer<S extends ZoneScheme = ZoneScheme>({
  model,
  gltf,
  variants,
  zoneScheme,
  zoneTints,
  environment,
  grid = false,
  groundBound = true,
  snapshotRef,
  loadingLabel = 'Loading model…',
  loadingOverlay = DefaultLoadingOverlay,
  className,
  children,
}: ProductViewerProps<S>): ReactElement {
  const hostRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)

  const background = useToken(hostRef, '--pv-canvas-bg', FALLBACK.bg)
  const gridCell = useToken(hostRef, '--pv-grid-cell', FALLBACK.gridCell)
  const gridSection = useToken(
    hostRef,
    '--pv-grid-section',
    FALLBACK.gridSection,
  )

  // `frameloop="demand"` renders nothing at all on cold mount under R3F v9, so
  // this stays on "always" - but "always" alone keeps the GPU busy while someone
  // reads the page far below the canvas. Pausing the loop when the canvas leaves
  // the viewport keeps the mode that works without the cost.
  //
  // Both projects this came from hit the demand bug independently and each wrote
  // its own note about it. That is the sort of thing a package is for.
  useEffect(() => {
    const host = hostRef.current
    if (!host || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? true),
      { rootMargin: '200px' },
    )
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  // Scene units follow the model: with realLength the scene is in the caller's
  // unit and a grid square means something; without it everything is relative to
  // a roughly two-unit object.
  const size = model.realLength ?? 2

  return (
    <div
      ref={hostRef}
      // Smooth-scroll libraries must not eat wheel events here: OrbitControls
      // owns them, and without this the model zooms while the page scrolls
      // underneath it. Harmless when no such library is present.
      data-lenis-prevent
      className={['pv-viewer', className].filter(Boolean).join(' ')}
    >
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 2]}
        camera={{
          position: [size * 1.05, size * 0.65, size * 1.3],
          fov: 40,
          near: size * 0.01,
          far: size * 50,
        }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          // Without this the drawing buffer may be cleared before toDataURL runs
          // and the snapshot comes back blank. It costs a buffer copy, so only
          // when a snapshot is actually wanted.
          preserveDrawingBuffer: Boolean(snapshotRef),
        }}
      >
        <color attach="background" args={[background]} />
        {environment ?? <DefaultEnvironment />}
        {snapshotRef ? <SnapshotCapture snapshotRef={snapshotRef} /> : null}

        <ambientLight intensity={0.35} />
        <directionalLight
          position={[size * 2, size * 3, size * 1.5]}
          intensity={1.2}
        />

        <Suspense fallback={null}>
          <ProductModel
            model={model}
            gltf={gltf}
            variants={variants}
            zoneScheme={zoneScheme}
            zoneTints={zoneTints}
          />
          <ContactShadows
            opacity={0.35}
            scale={size * 3.5}
            blur={2.4}
            far={size * 1.2}
            // Baked once. A shadow recomputed every frame for a model that never
            // moves is the cheapest thing here to delete.
            frames={1}
          />
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

        <OrbitControls
          makeDefault
          target={[0, size * 0.22, 0]}
          enablePan={false}
          minPolarAngle={groundBound ? 0.15 : 0}
          maxPolarAngle={groundBound ? Math.PI / 2 - 0.05 : Math.PI}
          minDistance={size * 0.45}
          maxDistance={size * 3}
          enableDamping
          dampingFactor={0.08}
        />
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
    </div>
  )
}

export default ProductViewer
