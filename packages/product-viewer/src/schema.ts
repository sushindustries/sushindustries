import * as z from 'zod'
import type { ModelConfig, Tint } from './types'
import type { ZoneScheme } from './zones'

/**
 * The viewer's data contract, at runtime.
 *
 * A TypeScript type is erased before anything runs, so it says nothing about a
 * JSON file someone uploaded. If products are meant to be data rather than code
 * - a new one being an asset plus a document, never a pull request - then
 * something has to reject a malformed document at the boundary, and this is it.
 *
 * Scope is deliberately narrow: **only what the viewer itself consumes.** Option
 * groups, labels, swatches, hotspots and pricing are the application's
 * vocabulary, they differ per project, and a component that validated them would
 * be dictating a domain model rather than rendering a model. Compose this into
 * your own schema instead of extending it.
 *
 * `zod` is an optional peer and this module is a separate entry point, so a
 * consumer who only wants to render a model never installs it and never pays
 * for it.
 */

/**
 * Red, green and blue multipliers.
 *
 * Not clamped to 0-1: values above 1 brighten, which is occasionally what you
 * want and never worth a validation error.
 */
export const tintSchema = z.tuple([z.number(), z.number(), z.number()])

export const modelConfigSchema = z.object({
  /**
   * Where the GLB lives. Any string a loader can fetch - a path, an absolute
   * URL, a signed one. Not `z.url()`, because `/models/cabin.glb` is the common
   * case and is not a URL.
   */
  url: z.string().min(1),

  /**
   * The longest horizontal dimension, in whatever unit the scene works in.
   *
   * Generated and scanned models carry no reliable scale, so this is what
   * calibrates the camera, the shadow and the grid. Omitted, the model is
   * normalised to roughly two units - fine alone, wrong as soon as a grid square
   * has to mean a metre or two products must look right side by side.
   */
  realLength: z.number().positive().optional(),

  /**
   * Asset licence, carried rather than enforced.
   *
   * Sample and marketplace assets arrive under terms that outlive whoever
   * downloaded them, and the moment to record that is the moment it enters the
   * catalogue, not the audit.
   */
  license: z.string().optional(),
})

/**
 * Tints for one zone scheme, keyed by that scheme's own zone names.
 *
 * A function of the scheme rather than a fixed object, because the zone names
 * belong to whoever defined them. Passing `wallRoofZones` gets you a schema that
 * accepts `wall` and `roof` and rejects anything else; passing your own gets you
 * yours.
 */
export function zoneTintsSchema<Z extends string>(scheme: ZoneScheme<Z>) {
  return z.object(
    Object.fromEntries(
      scheme.zones.map((zone) => [zone, tintSchema.optional()]),
    ) as Record<Z, z.ZodOptional<typeof tintSchema>>,
  )
}

/**
 * The full viewer input, for validating a stored or uploaded document whole.
 *
 * `variants` are names that must exist inside the GLB's `KHR_materials_variants`
 * extension. Nothing here can check that - the asset is the only authority - so
 * read them back with `listVariants` after loading and compare with
 * `missingVariants`. A name that is absent applies silently, which is the
 * failure this schema cannot save you from.
 */
export function viewerConfigSchema<Z extends string>(scheme?: ZoneScheme<Z>) {
  return z.object({
    model: modelConfigSchema,
    variants: z.array(z.string().min(1)).default([]),
    zoneTints: scheme
      ? zoneTintsSchema(scheme).optional()
      : z.never().optional(),
  })
}

/**
 * Proof that the two definitions still describe the same shape.
 *
 * `types.ts` is written by hand so the published types depend on nothing, which
 * leaves the usual risk of a hand-written type and a validator drifting apart.
 * These assignments fail to compile the moment they do, which is the whole
 * reason the duplication is tolerable.
 */
const _schemaMatchesTypes: ModelConfig = {} as z.infer<typeof modelConfigSchema>
const _typesMatchSchema: z.infer<typeof modelConfigSchema> = {} as ModelConfig
const _tintMatches: Tint = {} as z.infer<typeof tintSchema>
void _schemaMatchesTypes
void _typesMatchSchema
void _tintMatches

export type { ModelConfig, Tint } from './types'
