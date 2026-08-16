import { BufferGeometry, Float32BufferAttribute } from 'three'
import { describe, expect, it } from 'vitest'
import {
  computeZoneAttribute,
  defineZoneScheme,
  wallRoofZones,
} from '../src/zones'

/**
 * A geometry built from explicit vertices, so a test can state the shape it
 * means rather than load an asset and hope.
 */
function geometry(
  vertices: Array<{
    pos: [number, number, number]
    nrm: [number, number, number]
  }>,
): BufferGeometry {
  const g = new BufferGeometry()
  g.setAttribute(
    'position',
    new Float32BufferAttribute(
      vertices.flatMap((v) => v.pos),
      3,
    ),
  )
  g.setAttribute(
    'normal',
    new Float32BufferAttribute(
      vertices.flatMap((v) => v.nrm),
      3,
    ),
  )
  return g
}

const zonesOf = (g: BufferGeometry): number[] =>
  Array.from((g.getAttribute('aZone') as Float32BufferAttribute).array)

describe('computeZoneAttribute', () => {
  it('sorts a wall from a roof by height and normal tilt', () => {
    // A 10-unit-tall box. The roof floor sits at y = 5.5, and a roof vertex
    // also needs |normal.y| > 0.35 to distinguish it from a gable wall, which
    // reaches the same height while staying vertical.
    const g = geometry([
      { pos: [0, 0, 0], nrm: [1, 0, 0] }, // low, vertical  -> wall
      { pos: [0, 10, 0], nrm: [0, 1, 0] }, // high, sloped   -> roof
      { pos: [0, 9, 0], nrm: [1, 0, 0] }, // high, vertical -> wall (gable)
      { pos: [0, 2, 0], nrm: [0, 1, 0] }, // low, sloped    -> wall (floor)
    ])

    expect(computeZoneAttribute(g, wallRoofZones)).toBe(true)
    expect(zonesOf(g)).toEqual([0, 1, 0, 0])
  })

  it('is idempotent, because drei shares one parsed scene between mounts', () => {
    const g = geometry([{ pos: [0, 0, 0], nrm: [0, 1, 0] }])
    expect(computeZoneAttribute(g, wallRoofZones)).toBe(true)
    // A second pass - React Strict Mode alone will do it - must not recompute,
    // and must not wrap an already wrapped geometry.
    expect(computeZoneAttribute(g, wallRoofZones)).toBe(false)
  })

  it('skips a geometry with no normals rather than throwing', () => {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3))
    expect(computeZoneAttribute(g, wallRoofZones)).toBe(false)
    expect(g.getAttribute('aZone')).toBeUndefined()
  })

  it('supports more than two zones, which the original could not', () => {
    // The whole point of the generalisation: a jeweller's three-zone scheme is
    // expressible, where `{ wall, roof }` made zone tinting building-only.
    const bandZones = defineZoneScheme({
      zones: ['base', 'middle', 'top'],
      classify: ({ position, bounds }) => {
        const height = bounds.max.y - bounds.min.y
        const t = (position.y - bounds.min.y) / height
        return t > 0.66 ? 'top' : t > 0.33 ? 'middle' : 'base'
      },
    })

    const g = geometry([
      { pos: [0, 0, 0], nrm: [0, 1, 0] },
      { pos: [0, 5, 0], nrm: [0, 1, 0] },
      { pos: [0, 10, 0], nrm: [0, 1, 0] },
    ])

    computeZoneAttribute(g, bandZones)
    expect(zonesOf(g)).toEqual([0, 1, 2])
  })

  it('falls back to zone 0 when a classifier returns an unlisted name', () => {
    const broken = defineZoneScheme({
      zones: ['a', 'b'],
      // Deliberately dishonest: a scheme assembled at runtime from a config file
      // can return a name that is not in its own list, and a viewer that threw
      // here would turn a stale document into a blank screen.
      classify: () => 'c' as 'a',
    })
    const g = geometry([{ pos: [0, 0, 0], nrm: [0, 1, 0] }])
    computeZoneAttribute(g, broken)
    expect(zonesOf(g)).toEqual([0])
  })
})
