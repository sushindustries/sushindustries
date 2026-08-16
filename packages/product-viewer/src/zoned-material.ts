import { Color } from 'three'
import type { Material } from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import type { ZoneScheme } from './zones'

/**
 * Wraps a PBR material in a shader that multiplies its colour per geometric
 * zone (see `zones.ts`).
 *
 * Multiply, not replace: the grain, roughness and normal detail of the original
 * texture survive and only the hue moves. Replacing would flatten the asset to a
 * paint chip.
 *
 * `three-custom-shader-material` is an optional peer. Nothing in the core entry
 * point imports this file, so a project whose models have proper per-part meshes
 * never installs it and never ships the chunk.
 */

/** A material wrapped by {@link createZonedMaterial}. */
export interface ZonedMaterial extends Material {
  uniforms: {
    uZoneTint: { value: Color[] }
  }
}

/**
 * Builds the fragment shader for a given number of zones.
 *
 * Generated rather than written because the count is a property of the scheme,
 * and the first draft hardcoded two uniforms named after a house.
 *
 * The zone is selected, not blended. The original mixed two tints by the
 * interpolated attribute, which softened the seam across triangles whose
 * vertices straddled a boundary; with N zones there is no meaningful
 * interpolation between three or more colours, and a hard edge along a roofline
 * is closer to what the asset actually depicts than a gradient was. Boundary
 * triangles therefore now change colour at the midpoint instead of fading.
 */
function fragmentShader(count: number): string {
  const branches = Array.from(
    { length: count - 1 },
    (_, i) =>
      `  if (vZone > ${(i + 0.5).toFixed(1)} && vZone < ${(i + 1.5).toFixed(1)}) tint = uZoneTint[${i + 1}];`,
  ).join('\n')

  return /* glsl */ `
uniform vec3 uZoneTint[${count}];
varying float vZone;

void main() {
  vec3 tint = uZoneTint[0];
${branches}
  csm_DiffuseColor.rgb *= tint;
}
`
}

const vertexShader = /* glsl */ `
attribute float aZone;
varying float vZone;

void main() {
  vZone = aZone;
}
`

/**
 * Wraps a material so each zone can be tinted independently.
 *
 * Every zone starts at white, which multiplies to the asset's own colours - so
 * a material created but never tinted is visually identical to the one it wrapped.
 */
export function createZonedMaterial(
  baseMaterial: Material,
  scheme: ZoneScheme,
): ZonedMaterial {
  const count = scheme.zones.length
  if (count < 1) {
    throw new Error('A zone scheme needs at least one zone.')
  }

  return new CustomShaderMaterial({
    // Cloned so two meshes sharing one material do not share one set of
    // uniforms - without this, tinting a wall tints every mesh that happened to
    // be authored with the same material.
    baseMaterial: baseMaterial.clone(),
    vertexShader,
    fragmentShader: fragmentShader(count),
    uniforms: {
      uZoneTint: {
        value: Array.from({ length: count }, () => new Color(1, 1, 1)),
      },
    },
  }) as unknown as ZonedMaterial
}

/**
 * Applies tints to a wrapped material.
 *
 * Zones absent from `tints` are reset to white rather than left as they were, so
 * clearing a selection actually clears it. A name that is not in the scheme is
 * ignored - the scheme is the authority, and throwing here would turn a stale
 * saved configuration into a blank screen.
 */
export function applyZoneTints(
  material: ZonedMaterial,
  scheme: ZoneScheme,
  tints: Readonly<Record<string, readonly [number, number, number]>>,
): void {
  scheme.zones.forEach((zone, i) => {
    const tint = tints[zone]
    const target = material.uniforms.uZoneTint.value[i]
    if (!target) return
    if (tint) target.setRGB(tint[0], tint[1], tint[2])
    else target.setRGB(1, 1, 1)
  })
}
