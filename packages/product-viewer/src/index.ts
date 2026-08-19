/**
 * `@sushindustries/product-viewer` - the framework-free half.
 *
 * Everything here is plain three.js. No React, no renderer, no assumption that
 * a browser is even running one, which is what lets the same code validate a
 * catalogue at build time and drive a viewer at runtime.
 *
 * The two optional peers are kept out of this entry point on purpose:
 *
 *  - `zod` lives behind `@sushindustries/product-viewer/schema`
 *  - `three-custom-shader-material` lives behind
 *    `@sushindustries/product-viewer/zoned-material`
 *
 * A consumer who only renders models therefore installs neither and ships
 * neither. Importing either subpath is the moment you opt in.
 */

export type {
	AgentRef,
	ThreeDModelJsonLd,
	ThreeDModelJsonLdInput,
} from "./json-ld";
export { encodingFormatFor, threeDModelJsonLd } from "./json-ld";
export type { LoadOptions } from "./load";
export { disposeProductModel, loadProductModel } from "./load";
export type { ModelConfig, Tint, ZoneTints } from "./types";
export { applyVariant, listVariants, missingVariants } from "./variants";
export type { ZoneOf, ZoneScheme, ZoneVertex } from "./zones";
export { computeZoneAttribute, defineZoneScheme, wallRoofZones } from "./zones";
