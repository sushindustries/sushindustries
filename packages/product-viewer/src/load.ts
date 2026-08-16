import { Material, Mesh, Texture } from 'three'
import { GLTFLoader } from 'three-stdlib'
import type { GLTF } from 'three-stdlib'

/**
 * Loading a GLB, and - the part that usually gets left out - unloading one.
 *
 * drei's `useGLTF` keeps its own suspense cache. That cache cannot be
 * invalidated, cannot be primed from a route loader, is invisible to devtools,
 * and never evicts. The last one is the expensive one: GPU memory is not
 * garbage-collected, so a catalogue where someone browses thirty products holds
 * thirty parsed scenes with their textures resident until the tab is closed.
 *
 * These two functions exist so a real cache can own the asset instead. They are
 * deliberately framework-free; the TanStack Query binding that uses them is a
 * dozen lines in the React package and could as easily be written against
 * anything else.
 */

export interface LoadOptions {
  /**
   * Called with the loader before it reads anything.
   *
   * The hook for Draco, Meshopt and KTX2 - all of which need a decoder wired in,
   * all of which need a decoder path this package has no business choosing.
   */
  configureLoader?: (loader: GLTFLoader) => void
  /** Aborts the fetch. Rejects with the signal's reason. */
  signal?: AbortSignal
}

/**
 * Loads and parses a GLB.
 *
 * Resolves the whole `GLTF` object rather than its `scene`, because
 * `applyVariant` calls `gltf.parser.getDependency` and the parser is only
 * reachable from the former. Any cache holding these must hold the whole thing.
 */
export function loadProductModel(
  url: string,
  { configureLoader, signal }: LoadOptions = {},
): Promise<GLTF> {
  return new Promise<GLTF>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason as Error)
      return
    }

    const loader = new GLTFLoader()
    configureLoader?.(loader)

    let settled = false
    const onAbort = () => {
      if (settled) return
      settled = true
      reject(signal?.reason as Error)
    }
    signal?.addEventListener('abort', onAbort, { once: true })

    loader.load(
      url,
      (gltf) => {
        signal?.removeEventListener('abort', onAbort)
        if (settled) {
          // Arrived after an abort. Nobody is waiting for it, and leaving it
          // parsed would leak exactly the memory this module exists to reclaim.
          disposeProductModel(gltf)
          return
        }
        settled = true
        resolve(gltf)
      },
      undefined,
      (error) => {
        signal?.removeEventListener('abort', onAbort)
        if (settled) return
        settled = true
        reject(
          error instanceof Error
            ? error
            : new Error(`Failed to load ${url}: ${String(error)}`),
        )
      },
    )
  })
}

/** Every texture referenced by a material, whatever the slot is called. */
function texturesOf(material: Material): Texture[] {
  const found: Texture[] = []
  for (const value of Object.values(material as unknown as object)) {
    if (value instanceof Texture) found.push(value)
  }
  // Custom shader materials hang their textures off uniforms instead.
  const uniforms = (
    material as unknown as { uniforms?: Record<string, unknown> }
  ).uniforms
  if (uniforms) {
    for (const uniform of Object.values(uniforms)) {
      const value = (uniform as { value?: unknown } | null)?.value
      if (value instanceof Texture) found.push(value)
    }
  }
  return found
}

/**
 * Releases every GPU resource the asset holds.
 *
 * Call this when a cache evicts the entry. Nothing else will: three allocates
 * buffers and textures on the GPU, and the JavaScript garbage collector has no
 * idea they exist, so dropping the last reference to a `GLTF` frees the
 * bookkeeping and leaves the memory.
 *
 * Traverses the scene *and* the parser's associations. The scene alone is not
 * enough - `applyVariant` pulls variant materials out of the parser on demand,
 * and a model whose alternate materials were viewed and then swapped away holds
 * every one of them somewhere the scene graph no longer points.
 *
 * Safe to call twice; three's `dispose` is idempotent.
 */
export function disposeProductModel(gltf: GLTF): void {
  const materials = new Set<Material>()
  const textures = new Set<Texture>()

  gltf.scene.traverse((object) => {
    if (!(object instanceof Mesh)) return
    object.geometry?.dispose()
    const applied: unknown = object.material
    for (const material of Array.isArray(applied) ? applied : [applied]) {
      if (material instanceof Material) materials.add(material)
    }
    // Stashed by `applyVariant` so unmapped meshes can revert. Nothing else
    // references it once the scene is gone.
    const original: unknown = object.userData.originalMaterial
    for (const material of Array.isArray(original) ? original : [original]) {
      if (material instanceof Material) materials.add(material)
    }
  })

  // Everything the parser has created so far, including variant materials that
  // were fetched and later swapped out of the scene.
  const associations = (
    gltf.parser as unknown as { associations?: Map<unknown, unknown> }
  ).associations
  if (associations) {
    for (const created of associations.keys()) {
      if (created instanceof Material) materials.add(created)
      else if (created instanceof Texture) textures.add(created)
    }
  }

  for (const material of materials) {
    for (const texture of texturesOf(material)) textures.add(texture)
    material.dispose()
  }
  for (const texture of textures) texture.dispose()
}
