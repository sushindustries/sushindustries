/**
 * `@sushindustries/react-product-viewer` - the React adapter.
 *
 * The core package holds everything that is just three.js; this holds the
 * component and the hooks. The two TanStack integrations are separate entry
 * points because both their peers are optional:
 *
 *  - `@sushindustries/react-product-viewer/query` - TanStack Query owns the
 *    asset, so a route loader can preload it and eviction actually frees the GPU
 *  - `@sushindustries/react-product-viewer/router` - TanStack Router owns the
 *    selection, so a configured product is a URL somebody can send
 *
 * `ProductViewer` is exported both by name and as the default. The default is
 * not a style choice: `React.lazy` requires one, and this must be lazily mounted
 * because three and R3F are ~600 kB that cannot run on a server.
 */

export { ProductViewer, default } from './product-viewer'
export type { ProductViewerProps } from './product-viewer'
export { ProductModel } from './product-model'
export type { ProductModelProps } from './product-model'
export { DefaultLoadingOverlay } from './loading-overlay'
export type {
  LoadingOverlayProps,
  LoadingOverlayRenderer,
} from './loading-overlay'

export { ProductHero, HeroInteractive } from './product-hero'
export type { ProductHeroProps } from './product-hero'
export { ViewIn3D } from './view-in-3d'
export type { ViewIn3DProps } from './view-in-3d'
export { VariantButton, useVariantSwatches } from './variant-swatch'
export type { VariantButtonProps } from './variant-swatch'
export { useViewIn3D } from './use-view-in-3d'
export type { UseViewIn3DOptions, UseViewIn3DResult } from './use-view-in-3d'
export { ProductModelJsonLd } from './json-ld'
