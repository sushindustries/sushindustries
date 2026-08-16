import type { ZoneOf, ZoneScheme } from './zones'

/**
 * The viewer's types, written by hand rather than inferred from zod.
 *
 * The schemas in `schema.ts` are the runtime contract and these are the compile-
 * time one, and they are checked against each other there. Two definitions of
 * one shape is normally the thing to avoid - but zod is an optional peer, and a
 * type inferred from it puts `z.infer<...>` in the published `.d.ts` of the main
 * entry point. Anyone who installed the viewer to render a model would then need
 * zod's types on disk to typecheck their own code, which is not optional at all.
 *
 * So: the main entry ships types that depend on nothing, `/schema` ships the
 * validators, and a consumer chooses whether validation is part of their build.
 */

/**
 * Red, green and blue multipliers.
 *
 * Not clamped to 0-1: values above 1 brighten, which is occasionally what you
 * want and never worth a validation error.
 */
export type Tint = readonly [number, number, number]

export interface ModelConfig {
  /**
   * Where the GLB lives. Any string a loader can fetch - a path, an absolute
   * URL, a signed one.
   */
  url: string

  /**
   * The longest horizontal dimension, in whatever unit the scene works in.
   *
   * Generated and scanned models carry no reliable scale, so this is what
   * calibrates the camera, the shadow and the grid. Omitted, the model is
   * normalised to roughly two units - fine alone, wrong as soon as a grid square
   * has to mean a metre or two products must look right side by side.
   */
  realLength?: number

  /** Asset licence, carried rather than enforced. */
  license?: string
}

/**
 * Tints keyed by the zone names of a particular scheme.
 *
 * `ZoneTints<typeof wallRoofZones>` is `{ wall?: Tint; roof?: Tint }` - the
 * names come from the scheme you defined, so a typo is a type error rather than
 * a zone that silently never tints.
 */
export type ZoneTints<S extends ZoneScheme = ZoneScheme> = Partial<
  Record<ZoneOf<S>, Tint>
>
