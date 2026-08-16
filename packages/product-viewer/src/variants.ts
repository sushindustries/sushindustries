import { Mesh } from 'three'
import type { Object3D } from 'three'
import type { GLTF } from 'three-stdlib'

/**
 * Material swapping through `KHR_materials_variants`.
 *
 * The variant materials live inside the GLB, so switching one costs no network
 * request and no scene reload - the parser has already parsed them and caches
 * each on first use.
 *
 * This is the right mechanism whenever the options are genuinely different
 * materials rather than the same material in a different colour. Spruce and
 * larch differ in grain, not hue; gold and silver differ in reflectance. A
 * diffuse multiply cannot express either, which is why `zones.ts` exists as the
 * fallback for models that cannot be split into per-part meshes rather than as
 * the default.
 */

interface VariantsRootExtension {
  variants: Array<{ name: string }>
}

interface VariantsMeshExtension {
  mappings: Array<{ material: number; variants: number[] }>
}

function rootExtension(gltf: GLTF): VariantsRootExtension | undefined {
  const userData = gltf.userData as {
    gltfExtensions?: Record<string, unknown>
  }
  return userData.gltfExtensions?.KHR_materials_variants as
    VariantsRootExtension | undefined
}

/**
 * The variant names actually present in the asset.
 *
 * Worth calling at build or seed time: a configurator that offers five options
 * against a GLB carrying two fails silently, because `applyVariant` cannot
 * distinguish "no such variant" from "nothing to change".
 */
export function listVariants(gltf: GLTF): string[] {
  return rootExtension(gltf)?.variants.map((v) => v.name) ?? []
}

/**
 * The variant names offered that the asset does not actually carry.
 *
 * Pair with {@link listVariants}. Empty means the configuration and the asset
 * agree; anything else is an option a customer can click that will do nothing at
 * all. Worth running at seed, upload or build time - by the time it reaches a
 * browser the only symptom is a control that appears to work.
 */
export function missingVariants(
  offered: readonly string[],
  present: readonly string[],
): string[] {
  const known = new Set(present)
  return offered.filter((name) => !known.has(name))
}

/**
 * Switches the scene to a named variant.
 *
 * Resolves once every mapped material has been fetched from the parser, so
 * awaiting it means the frame after is the frame that shows the change.
 */
export async function applyVariant(
  gltf: GLTF,
  variantName: string,
  /**
   * The scene to change, when it is not the loader's own.
   *
   * A three.js object has exactly one parent, so two viewers cannot both
   * render `gltf.scene` - the second to mount takes it and the first goes
   * blank. Anything showing the same asset twice (a hero and a full-screen
   * dialog, a grid of thumbnails) renders a clone, and the clone is what needs
   * its materials swapped. The parser still comes from `gltf`, because that is
   * the only place it exists.
   */
  scene: Object3D = gltf.scene,
): Promise<void> {
  const extension = rootExtension(gltf)
  if (!extension) return

  const variantIndex = extension.variants.findIndex(
    (v) => v.name === variantName,
  )
  const pending: Array<Promise<void>> = []

  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return
    const meshExtensions = object.userData.gltfExtensions as
      Record<string, unknown> | undefined
    const meshDef = meshExtensions?.KHR_materials_variants as
      VariantsMeshExtension | undefined
    if (!meshDef) return

    // Remember the base material once, so a mesh this variant does not map - a
    // window, when only the cladding changes - reverts to what it started as
    // instead of keeping whatever the previously applied variant left.
    object.userData.originalMaterial ??= object.material

    const mapping =
      variantIndex >= 0
        ? meshDef.mappings.find((m) => m.variants.includes(variantIndex))
        : undefined

    if (mapping) {
      pending.push(
        gltf.parser
          .getDependency('material', mapping.material)
          .then((material) => {
            object.material = material
            gltf.parser.assignFinalMaterial(object)
          }),
      )
    } else {
      object.material = object.userData.originalMaterial
    }
  })

  await Promise.all(pending)
}
