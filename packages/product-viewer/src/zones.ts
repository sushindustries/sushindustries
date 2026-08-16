import { Box3, Float32BufferAttribute, Vector3 } from 'three'
import type { BufferGeometry } from 'three'

/**
 * Splits a single mesh into material zones by geometry rather than by UV.
 *
 * Generated and photogrammetric models arrive as one blob sharing one texture
 * atlas - hundreds of micro-islands with no per-part layout - so a mask drawn in
 * texture space has nothing stable to key on. Shape does: a roof is a sloped
 * surface in the upper part of the bounding box, a wall is vertical. That holds
 * however bad the UVs are.
 *
 * The result is a vertex attribute `aZone` holding the zone's index, which
 * `zoned-material.ts` reads to tint each zone separately.
 *
 * This is a workaround, and worth naming as one. If you can author the model
 * with each part as its own mesh, use `KHR_materials_variants` instead and
 * ignore this file - real per-part materials beat a heuristic every time. Keep
 * it for assets you did not author and cannot re-topologise.
 */

/** One vertex, with the whole model's bounds for context. */
export interface ZoneVertex {
  /** Object-space position of this vertex. */
  readonly position: Vector3
  /** Object-space normal of this vertex. */
  readonly normal: Vector3
  /** Bounds of the geometry being classified, computed once per mesh. */
  readonly bounds: Box3
}

/**
 * A named set of zones and the rule that sorts vertices into them.
 *
 * The zone names are yours. The first draft of this hardcoded `wall` and `roof`
 * into the type, the schema and the shader's uniform names, which meant the
 * whole zone-tinting path was unusable by anyone not rendering a building.
 * Nothing about the technique is specific to houses, so nothing about the
 * interface is either.
 */
export interface ZoneScheme<Z extends string = string> {
  /**
   * Zone names, in the order their indices are assigned.
   *
   * Order is part of the contract: it is what `aZone` stores and what the
   * generated shader indexes. Reordering an existing scheme silently repaints
   * every model using it, so append rather than insert.
   */
  readonly zones: readonly Z[]
  /** Which zone this vertex belongs to. Must return a member of `zones`. */
  classify(vertex: ZoneVertex): Z
}

/**
 * Identity helper that infers the zone names as literals.
 *
 * Written out, `{ zones: ['wall', 'roof'] }` infers `string[]` and every
 * downstream `Record<Z, Tint>` collapses to `Record<string, Tint>` - you keep
 * the types and lose the only thing they were for, which is knowing that
 * `zoneTints.rooof` is a typo.
 */
export function defineZoneScheme<const Z extends string>(
  scheme: ZoneScheme<Z>,
): ZoneScheme<Z> {
  return scheme
}

/**
 * The original heuristic, kept as a preset so it has a name.
 *
 * Roof: the top ~45% of the height AND a normal tilted far enough off vertical
 * to not be a plain gable wall, which sits just as high.
 */
export const wallRoofZones = defineZoneScheme({
  zones: ['wall', 'roof'],
  classify: ({ position, normal, bounds }) => {
    const roofFloor = bounds.min.y + (bounds.max.y - bounds.min.y) * 0.55
    return Math.abs(normal.y) > 0.35 && position.y > roofFloor ? 'roof' : 'wall'
  },
})

/** The zone names of a scheme, as a union. */
export type ZoneOf<S> = S extends ZoneScheme<infer Z> ? Z : never

/**
 * Writes the `aZone` attribute onto a geometry, in place.
 *
 * Idempotent: a geometry that already carries the attribute is left alone,
 * because drei shares one parsed scene between mounts and recomputing would be
 * pure work. Returns whether it did anything, which is the only way a caller can
 * tell a cached geometry from a fresh one.
 *
 * A geometry with no `position` or no `normal` is skipped rather than thrown
 * over: it cannot be classified by shape, and a viewer that renders the model
 * untinted is a better failure than one that renders nothing.
 */
export function computeZoneAttribute(
  geometry: BufferGeometry,
  scheme: ZoneScheme,
): boolean {
  if (geometry.getAttribute('aZone')) return false

  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  if (!position || !normal) return false

  const bounds = new Box3().setFromBufferAttribute(
    position as Parameters<Box3['setFromBufferAttribute']>[0],
  )

  const index = new Map(scheme.zones.map((zone, i) => [zone, i]))
  const count = position.count
  const zones = new Float32Array(count)

  // One vertex object reused across the loop rather than one allocated per
  // vertex: a 300k-vertex model would otherwise allocate 600k Vector3s in a
  // tight loop, and the classifier has no reason to retain them.
  const vertex = { position: new Vector3(), normal: new Vector3(), bounds }

  for (let i = 0; i < count; i++) {
    vertex.position.set(position.getX(i), position.getY(i), position.getZ(i))
    vertex.normal.set(normal.getX(i), normal.getY(i), normal.getZ(i))
    zones[i] = index.get(scheme.classify(vertex)) ?? 0
  }

  geometry.setAttribute('aZone', new Float32BufferAttribute(zones, 1))
  return true
}
