---
title: Product Viewer
summary: A 3D product viewer for TanStack applications, documented with itself.
---

Below is the real component, loading the real asset — the Sushindustries mark,
reconstructed from a 500,000-triangle scan and decimated to 40,000, with four
finishes authored into the GLB.

Drag it.

<!-- ::start:viewer model="/models/logo.glb" height="460" label="Loading the mark" -->
<!-- ::end:viewer -->

That is not a screenshot and not a video. It is the component this page
documents, mounted from the same package you would install, which is why it
cannot go out of date.

## Why it is built for TanStack

Two optional entry points, and both of them are the reason this exists rather
than another `<model-viewer>` wrapper:

```ts
// Query owns the asset, so a route loader preloads it — on hover, under
// defaultPreload: "intent" — and cache eviction actually frees the GPU.
import { productModelOptions } from "@sushindustries/react-product-viewer/query";

// Router owns the selection, so a configured product is a URL you can send.
import { useVariantSearch } from "@sushindustries/react-product-viewer/router";
```

If Query owns the GLB, the model is in memory before the route renders. If
Router owns the selection, "the mark, in white" is a link.

> [!TIP] Disposal is not optional
> three.js does not garbage-collect GPU memory. The core package pairs
> `loadProductModel` with `disposeProductModel`, and a viewer that mounts and
> unmounts without calling it leaks until the tab closes.
