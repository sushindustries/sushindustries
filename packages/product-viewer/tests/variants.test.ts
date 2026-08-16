import { BufferGeometry, Mesh, MeshStandardMaterial, Scene } from 'three'
import type { GLTF } from 'three-stdlib'
import { describe, expect, it } from 'vitest'
import { applyVariant, listVariants, missingVariants } from '../src/variants'

/**
 * A stand-in for a parsed GLB carrying `KHR_materials_variants`.
 *
 * Built rather than loaded. `applyVariant` reads exactly two things - the
 * extension blocks and `parser.getDependency` - and both are cheap to state
 * honestly here. Loading the Khronos sample instead would test three's GLTF
 * parser, put a multi-megabyte download in the way of a unit test, and still
 * exercise the same four branches.
 */
function gltfWithVariants(variantNames: string[]) {
  const materials = variantNames.map(
    (name) => new MeshStandardMaterial({ name: `material-${name}` }),
  )
  const base = new MeshStandardMaterial({ name: 'base' })

  const mapped = new Mesh(new BufferGeometry(), base)
  mapped.userData.gltfExtensions = {
    KHR_materials_variants: {
      mappings: variantNames.map((_, i) => ({ material: i, variants: [i] })),
    },
  }

  // A mesh the variants never mention - a window, when only cladding changes.
  const unmapped = new Mesh(new BufferGeometry(), base)
  unmapped.userData.gltfExtensions = {
    KHR_materials_variants: { mappings: [] },
  }

  const scene = new Scene()
  scene.add(mapped, unmapped)

  const gltf = {
    scene,
    userData: {
      gltfExtensions: {
        KHR_materials_variants: {
          variants: variantNames.map((name) => ({ name })),
        },
      },
    },
    parser: {
      getDependency: (kind: string, index: number) =>
        Promise.resolve(kind === 'material' ? materials[index] : undefined),
      assignFinalMaterial: () => {},
    },
  } as unknown as GLTF

  return { gltf, mapped, unmapped, materials, base }
}

describe('listVariants', () => {
  it('reads the names the asset actually carries', () => {
    const { gltf } = gltfWithVariants(['midnight', 'beach', 'street'])
    expect(listVariants(gltf)).toEqual(['midnight', 'beach', 'street'])
  })

  it('returns nothing for an asset without the extension', () => {
    const gltf = { userData: {} } as unknown as GLTF
    expect(listVariants(gltf)).toEqual([])
  })
})

describe('missingVariants', () => {
  it('names the options a configurator offers that the asset lacks', () => {
    // The bug this function exists for: a configurator offering five options
    // against a GLB carrying two, where every control appears to work.
    expect(missingVariants(['a', 'b', 'c'], ['a'])).toEqual(['b', 'c'])
  })

  it('is empty when the configuration and the asset agree', () => {
    expect(missingVariants(['a', 'b'], ['b', 'a'])).toEqual([])
  })
})

describe('applyVariant', () => {
  it('swaps the material of a mapped mesh', async () => {
    const { gltf, mapped, materials } = gltfWithVariants(['midnight', 'beach'])
    await applyVariant(gltf, 'beach')
    expect(mapped.material).toBe(materials[1])
  })

  it('reverts an unmapped mesh to the material it started with', async () => {
    const { gltf, unmapped, base } = gltfWithVariants(['midnight'])
    await applyVariant(gltf, 'midnight')
    expect(unmapped.material).toBe(base)
  })

  it('leaves the scene on its base materials for an unknown variant', async () => {
    // The runtime floor, not the fix: `applyVariant` cannot tell "no such
    // variant" from "nothing to change", so the viewer has to stay on screen
    // with the materials it had. Validate with `missingVariants` at build time.
    const { gltf, mapped, base } = gltfWithVariants(['midnight'])
    await applyVariant(gltf, 'no-such-variant')
    expect(mapped.material).toBe(base)
  })

  it('lets a later variant win where two map the same mesh', async () => {
    // The reason `variants` is an array. Neither donor project could express
    // two option groups applying at once.
    const { gltf, mapped, materials } = gltfWithVariants(['first', 'second'])
    await applyVariant(gltf, 'first')
    await applyVariant(gltf, 'second')
    expect(mapped.material).toBe(materials[1])
  })

  it('does nothing to an asset without the extension', async () => {
    const gltf = {
      userData: {},
      scene: new Scene(),
    } as unknown as GLTF
    await expect(applyVariant(gltf, 'anything')).resolves.toBeUndefined()
  })
})
