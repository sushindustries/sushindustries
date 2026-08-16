import { useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'

/**
 * Configurator state that lives in the URL.
 *
 * The mistake this exists to prevent is `useState`. It works, it is the obvious
 * thing, and it quietly removes the single most valuable property a configurator
 * has: that someone can send the thing they configured to somebody else. A
 * customer who spends ten minutes choosing cladding, roof and glazing and then
 * cannot share the result has been given a toy.
 *
 * Putting the selection in search params also gets you back-button semantics,
 * previews keyed on the same URL, and a quotation email that links to exactly
 * what was quoted - none of which need any further code.
 *
 * `@tanstack/react-router` is an optional peer. This module is a separate entry
 * point, so a project that never imports it never installs it.
 */

/** The shape this module reads and writes. */
export interface VariantSearch {
  /**
   * Selected variants, comma-separated, applied in order.
   *
   * A string rather than an array, and that is the whole design decision here.
   * Router's default serialiser JSON-encodes arrays, so `['beach']` reaches the
   * address bar as `?v=%5B%22beach%22%5D` - correct, round-trippable, and
   * unusable as the shareable artefact this exists to produce. `?v=beach,street`
   * survives being pasted into a message, read aloud, or printed on a quote.
   */
  v?: string
}

const SEPARATOR = ','

/** Splits the param into names, dropping empties. */
export function variantsOf(search: VariantSearch): string[] {
  return (search.v ?? '')
    .split(SEPARATOR)
    .map((name) => name.trim())
    .filter(Boolean)
}

/**
 * Parses the `v` search param without depending on a validation library.
 *
 * Spread into a route's `validateSearch`:
 *
 * ```ts filename="src/routes/product.$slug.tsx"
 * export const Route = createFileRoute('/product/$slug')({
 *   validateSearch: (search) => parseVariantSearch(search),
 * })
 * ```
 *
 * Unknown values are kept rather than rejected. A configurator URL outlives the
 * catalogue it was made from, so a link shared last year naming an option that
 * no longer exists should open the product rather than an error page - use
 * `missingVariants` against the loaded asset if you want to tell the customer.
 *
 * An array is still accepted on the way in, so a link written by hand as
 * `?v=a&v=b` works and normalises to the comma form on the next navigation.
 */
export function parseVariantSearch(
  search: Record<string, unknown>,
): VariantSearch {
  const raw = search.v
  if (raw === undefined || raw === null) return {}

  const names = (Array.isArray(raw) ? raw : [raw])
    .flatMap((value) =>
      typeof value === 'string' ? value.split(SEPARATOR) : [],
    )
    .map((name) => name.trim())
    .filter(Boolean)

  return names.length ? { v: names.join(SEPARATOR) } : {}
}

/**
 * Reads and writes the selected variants in the URL.
 *
 * ```tsx filename="src/routes/product.$slug.tsx"
 * const { variants, select } = useVariantSelection()
 * return <ProductViewer model={model} variants={variants} />
 * ```
 *
 * Every write uses `replace: true`. A colour picker dragged across twenty
 * swatches would otherwise put twenty entries in the history stack, and the back
 * button would walk the customer through their own indecision instead of
 * returning them to the catalogue.
 */
export function useVariantSelection() {
  const search = useSearch({ strict: false }) as VariantSearch
  const navigate = useNavigate()

  const variants = useMemo(() => variantsOf(search), [search.v])

  const set = useCallback(
    (next: readonly string[]) => {
      void navigate({
        // @ts-expect-error - `to` is omitted so the current route is kept, which
        // the typed navigate cannot express without knowing the route here.
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          v: next.length ? next.join(SEPARATOR) : undefined,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  /** Adds a variant, or removes it if already present. */
  const toggle = useCallback(
    (variant: string) => {
      set(
        variants.includes(variant)
          ? variants.filter((v) => v !== variant)
          : [...variants, variant],
      )
    },
    [variants, set],
  )

  /**
   * Replaces whichever variant is currently selected from `group` with `variant`.
   *
   * The common case a plain toggle gets wrong: cladding options are mutually
   * exclusive, so choosing larch has to deselect spruce rather than apply both.
   * The viewer would otherwise render whichever came last in the array and the
   * picker would show two options lit.
   */
  const select = useCallback(
    (group: readonly string[], variant: string) => {
      set([...variants.filter((v) => !group.includes(v)), variant])
    },
    [variants, set],
  )

  return { variants, set, toggle, select }
}
