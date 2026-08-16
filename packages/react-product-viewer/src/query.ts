import { queryOptions } from '@tanstack/react-query'
import {
  disposeProductModel,
  loadProductModel,
} from '@sushindustries/product-viewer'
import type { LoadOptions } from '@sushindustries/product-viewer'
import type { QueryClient } from '@tanstack/react-query'
import type { GLTF } from 'three-stdlib'

/**
 * TanStack Query owns the asset instead of drei.
 *
 * `useGLTF` keeps a module-level suspense cache. It works, and for a page with
 * one model it is the right amount of machinery. It stops working as soon as
 * you want any of four things:
 *
 *  - **Preloading.** A route loader cannot prime drei's cache, so the GLB starts
 *    downloading when the component mounts. With `defaultPreload: "intent"` and
 *    a loader, it starts on hover instead - the difference between a viewer that
 *    appears instantly and one that shows a progress ring for three seconds.
 *  - **Eviction.** drei's cache never releases anything. GPU memory is not
 *    garbage-collected, so a catalogue someone browses for a while holds every
 *    model they looked at until the tab closes.
 *  - **Invalidation.** A re-uploaded asset at the same URL is served from cache
 *    forever.
 *  - **Visibility.** Nothing about it appears in devtools.
 *
 * `@tanstack/react-query` is an optional peer. This module is a separate entry
 * point, so a project that never imports it never installs it.
 */

/** How the model query is keyed. Exported so you can invalidate by prefix. */
export const productModelKey = (url: string) => ['product-model', url] as const

export interface ProductModelQueryOptions extends LoadOptions {
  /**
   * How long an unused model stays in cache before it is disposed.
   *
   * Deliberately shorter than Query's five-minute default. The default is tuned
   * for JSON, where a stale entry costs a few kilobytes of heap; here it costs
   * every texture and vertex buffer of a model nobody is looking at, on a GPU
   * that may have well under a gigabyte to give.
   *
   * @default 120_000
   */
  gcTime?: number
}

/**
 * Query options for one GLB.
 *
 * ```ts filename="src/routes/product.$slug.tsx"
 * export const Route = createFileRoute('/product/$slug')({
 *   ssr: false,
 *   loader: ({ context, params }) =>
 *     context.queryClient.ensureQueryData(productModelOptions(urlFor(params.slug))),
 * })
 * ```
 *
 * The resolved value is the whole `GLTF`, not its `scene`: `applyVariant` calls
 * `gltf.parser.getDependency`, and the parser is only reachable from the former.
 *
 * > **Good to know**: pair this with {@link disposeModelCacheEntries}. Query
 * > will drop its reference to the `GLTF` when `gcTime` elapses, but nothing in
 * > Query knows the object owns GPU memory, so without that subscription the
 * > eviction frees the JavaScript and leaks the textures.
 */
export function productModelOptions(
  url: string,
  { gcTime = 120_000, ...load }: ProductModelQueryOptions = {},
) {
  return queryOptions({
    queryKey: productModelKey(url),
    queryFn: ({ signal }) => loadProductModel(url, { ...load, signal }),
    gcTime,
    // A parsed GLB at a given URL does not go stale on a timer. It changes when
    // the asset is republished, which is an invalidation, not an expiry.
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  })
}

/**
 * Disposes GPU resources when the cache evicts a model.
 *
 * Call once, next to where the `QueryClient` is created. Returns the
 * unsubscribe function.
 *
 * ```ts filename="src/query-client.ts"
 * const queryClient = new QueryClient()
 * disposeModelCacheEntries(queryClient)
 * ```
 *
 * This is the piece that makes Query a better owner of the asset than drei
 * rather than merely a different one. Without it you have swapped a cache that
 * never evicts for one that evicts and leaks.
 */
export function disposeModelCacheEntries(client: QueryClient): () => void {
  return client.getQueryCache().subscribe((event) => {
    if (event.type !== 'removed') return
    const [scope] = event.query.queryKey as readonly unknown[]
    if (scope !== 'product-model') return
    const gltf = event.query.state.data as GLTF | undefined
    if (gltf?.scene) disposeProductModel(gltf)
  })
}
