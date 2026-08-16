import {
  BufferGeometry,
  Mesh,
  MeshStandardMaterial,
  Scene,
  Texture,
} from 'three'
import type { GLTF } from 'three-stdlib'
import { describe, expect, it, vi } from 'vitest'
import { disposeProductModel } from '../src/load'

/**
 * Disposal is the reason this package owns loading at all.
 *
 * three allocates buffers and textures on the GPU and the JavaScript garbage
 * collector has no idea they exist, so a cache that evicts an entry without
 * calling this frees the bookkeeping and leaks the memory. drei's own cache
 * never evicts, which is how a catalogue ends up holding thirty parsed scenes.
 */
function sceneWithOneMesh() {
  const geometry = new BufferGeometry()
  const map = new Texture()
  const material = new MeshStandardMaterial({ map })
  const mesh = new Mesh(geometry, material)
  const scene = new Scene()
  scene.add(mesh)
  return { scene, geometry, material, map, mesh }
}

const gltfOf = (scene: Scene, associations = new Map<unknown, unknown>()) =>
  ({ scene, parser: { associations } }) as unknown as GLTF

describe('disposeProductModel', () => {
  it('disposes geometry, material and the material’s textures', () => {
    const { scene, geometry, material, map } = sceneWithOneMesh()
    const spies = [
      vi.spyOn(geometry, 'dispose'),
      vi.spyOn(material, 'dispose'),
      vi.spyOn(map, 'dispose'),
    ]

    disposeProductModel(gltfOf(scene))

    for (const spy of spies) expect(spy).toHaveBeenCalled()
  })

  it('disposes the material stashed by applyVariant', () => {
    // `applyVariant` keeps the original on `userData` so an unmapped mesh can
    // revert. Nothing else points at it once the scene is gone.
    const { scene, mesh } = sceneWithOneMesh()
    const original = new MeshStandardMaterial()
    mesh.userData.originalMaterial = original
    const spy = vi.spyOn(original, 'dispose')

    disposeProductModel(gltfOf(scene))

    expect(spy).toHaveBeenCalled()
  })

  it('disposes variant materials the scene no longer references', () => {
    // The case scene traversal alone misses: a customer viewed the gold ring,
    // switched to silver, and the gold material is now reachable only from the
    // parser's associations.
    const { scene } = sceneWithOneMesh()
    const swappedAway = new MeshStandardMaterial()
    const orphanTexture = new Texture()
    const spies = [
      vi.spyOn(swappedAway, 'dispose'),
      vi.spyOn(orphanTexture, 'dispose'),
    ]

    disposeProductModel(
      gltfOf(
        scene,
        new Map<unknown, unknown>([
          [swappedAway, { materials: 0 }],
          [orphanTexture, { textures: 0 }],
        ]),
      ),
    )

    for (const spy of spies) expect(spy).toHaveBeenCalled()
  })

  it('is safe to call twice, because a cache may evict what a hook already freed', () => {
    const { scene } = sceneWithOneMesh()
    const gltf = gltfOf(scene)
    disposeProductModel(gltf)
    expect(() => disposeProductModel(gltf)).not.toThrow()
  })

  it('tolerates a parser with no associations', () => {
    const { scene } = sceneWithOneMesh()
    const gltf = { scene, parser: {} } as unknown as GLTF
    expect(() => disposeProductModel(gltf)).not.toThrow()
  })
})
