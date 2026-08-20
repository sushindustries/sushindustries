---
title: Product Viewer API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Signature

```ts
ModelViewer({ model, gltf, variants, zoneScheme, zoneTints, scroll = "zoom", transparent = false, environment, grid = false, groundBound = true, snapshotRef, modelRef, controls = true, shadows = true, fit = false, pivot = "base", loadingLabel = "Loading model…", loadingOverlay = DefaultLoadingOverlay, scrollHint = "Hold ⌘ or Ctrl to zoom", className, children, }: ModelViewerProps<S>): ReactElement
```

<!-- /generated:api -->

## The layer under it

`ProductModel` is the piece the viewer mounts - the mesh, its variants and its
zone tints, without the canvas or the controls. Reach for it when you own the
scene:

```tsx
<Canvas>
	<ProductModel model={config} variants={["walnut"]} origin="base" />
</Canvas>
```

Its props are defined in `src/product-model.tsx` and documented there. There
is no second table on this page, because a table nothing generates is a table
that drifts - which this one did, invisibly, for as long as the doctor looked
for this file in the wrong package.
