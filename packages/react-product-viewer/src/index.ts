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

/*
 * `ModelViewer` is the canvas, and there is exactly one of it.
 *
 * It used to be `ProductViewer` in `src/product-viewer.tsx`, with a second,
 * partial copy in `elements/model-viewer/` that was being split out to sit
 * beside its own stylesheet, types and stories. Both were real and both were
 * maintained, and they drifted precisely as far as you would expect: `modelRef`,
 * `fit`, `controls`, `shadows` and `pivot` existed only in one, `scroll` and its
 * hint only in the other, and `ModelCard` used one while everything else used
 * the other.
 *
 * Two implementations of one component is not a refactor in progress, it is a
 * bug with a schedule - a fix to the canvas landed in whichever file the person
 * happened to open. The element won, the old file is gone, and the names below
 * are aliases so no consumer had to be rewritten to pay for an internal tidy.
 */
export {
	default,
	ModelViewer,
	ModelViewer as ProductViewer,
} from "./elements/model-viewer/model-viewer";
export type {
	ModelViewerProps,
	ModelViewerProps as ProductViewerProps,
	ModelViewerScroll,
} from "./elements/model-viewer/model-viewer.types";
export { ProductModelJsonLd } from "./json-ld";
export type {
	LoadingOverlayProps,
	LoadingOverlayRenderer,
} from "./loading-overlay";
export { DefaultLoadingOverlay } from "./loading-overlay";
export type { ProductHeroProps } from "./product-hero";

export { HeroInteractive, ProductHero } from "./product-hero";
/*
 * `ModelMark` is deliberately NOT re-exported here.
 *
 * It lazily imports the viewer from inside itself so that a page which only
 * names a mark ships no three until one becomes live. Re-exporting it from this
 * entry would defeat that entirely - this file imports the viewer statically,
 * so anything reachable from here already has it in its graph, and the bundler
 * says so out loud:
 *
 *   [INEFFECTIVE_DYNAMIC_IMPORT] src/product-viewer.tsx is dynamically imported
 *   by src/elements/model-mark/model-mark.tsx but also statically imported by
 *   src/index.ts
 *
 * It has its own entry instead:
 *
 *   import { ModelMark } from '@sushindustries/react-product-viewer/model-mark'
 */
export type { ProductModelProps } from "./product-model";
export { ProductModel } from "./product-model";
export type { UseViewIn3DOptions, UseViewIn3DResult } from "./use-view-in-3d";
export { useViewIn3D } from "./use-view-in-3d";
export type { VariantButtonProps } from "./variant-swatch";
export { useVariantSwatches, VariantButton } from "./variant-swatch";
export type { ViewIn3DProps } from "./view-in-3d";
export { ViewIn3D } from "./view-in-3d";
