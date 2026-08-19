---
title: Product Viewer API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

## Props

`ProductModel` is the component the viewer mounts. It has no registry entry
- this table is written by hand rather than generated - so it is worth
staying current with `packages/react-product-viewer/src/product-model.tsx`
by hand too.

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `model` | `ModelConfig` | - | The GLB to load: its URL and the metadata the viewer needs before the asset arrives. |
| `gltf?` | `GLTF` | - | An already-loaded asset, for when something else owns the cache - typically the result of `productModelOptions` resolved by a route loader. Omitted, the component loads `model.url` itself through drei's suspense cache. |
| `variants?` | `readonly string[]` | - | `KHR_materials_variants` names to apply, in order. Later entries win on conflict. The path to design assets for. |
| `pivot?` | `"base" \| "center"` | `"base"` | Where the origin sits inside the object. `base` rests the object on `y=0` for a product sitting still; `center` puts the origin at the bounding box's middle for anything that rotates, so a spin reads as spinning rather than orbiting. |
| `zoneScheme?` | `S extends ZoneScheme` | - | The zones `zoneTints` is keyed by. Required alongside `zoneTints`, meaningless without it. |
| `zoneTints?` | `ZoneTints<S>` | - | Per-zone colour multipliers, for a single-mesh model that was not authored with `KHR_materials_variants`. |

## Notes

`variants` and `zoneTints` are two different material paths, and which one an
asset takes is a property of the asset, not a choice made here. An asset with
`KHR_materials_variants` wants `variants`; a single-mesh asset with no
per-part materials wants `zoneScheme` and `zoneTints` instead. Passing both
is not an error, but only `variants` has any effect if the asset actually
defines them.

`gltf` and the component's own loading are not both active at once - passing
`gltf` skips the internal `useGLTF` call entirely, so `model.url` is read
only for identity (which asset this is), never fetched again.

Disposal is not automatic. Three.js does not garbage-collect GPU memory, and
a viewer that mounts and unmounts without calling `disposeProductModel` (from
`@sushindustries/product-viewer`) leaks until the tab closes - see the `[!TIP]`
on the Home tab.

Two optional entry points sit beside this component and are not props on it:
`productModelOptions` from `@sushindustries/react-product-viewer/query` (lets
TanStack Query own the asset, so a route loader can preload it) and
`useVariantSearch` from `@sushindustries/react-product-viewer/router` (lets
TanStack Router own the selected variant, so a configured product is a URL).
Neither changes `ProductModel`'s own prop contract; they just supply values
for `gltf` and `variants` from somewhere with more context than this
component has on its own.
