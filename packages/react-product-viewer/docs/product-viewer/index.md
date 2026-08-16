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

## The block that renders it

```md
<!-- ::start:viewer model="/models/logo.glb" height="460" -->
<!-- ::end:viewer -->
```

Three things keep an embedded 3D canvas from wrecking the page it sits in:

| Guard | Why |
| --- | --- |
| `lazy` | three and R3F are ~600 kB, fetched only for documents that use the block |
| `ClientOnly` | three cannot run on a server — SSR is a crash, not a slowdown |
| a reserved box | the fallback is the viewer's height, so prose does not jump |

> [!CAUTION] Do not render this eagerly
> `ProductViewer` is exported as a default specifically so `React.lazy` can
> take it. Importing it statically pulls the whole 3D bundle into your entry
> chunk, on every page, for every visitor.

## Install

<!-- ::start:tabs -->

### TanStack

```shell
tanstack add https://sushindustries.com/r/tanstack/product-viewer.json
```

### pnpm

```shell
pnpm add @sushindustries/react-product-viewer three @react-three/fiber @react-three/drei three-stdlib
```

<!-- ::end:tabs -->

## Usage

```tsx
import { lazy, Suspense } from "react";

const ProductViewer = lazy(
	() => import("@sushindustries/react-product-viewer"),
);

export function Page() {
	return (
		<Suspense fallback={null}>
			<ProductViewer
				model={{ url: "/models/logo.glb", realLength: 1 }}
				variants={["White"]}
				groundBound={false}
			/>
		</Suspense>
	);
}
```

## Props worth knowing

| Prop | Does |
| --- | --- |
| `model` | The GLB and its real-world size |
| `variants` | GLB material variants to apply, in order |
| `gltf` | An already-loaded asset, when something else owns the cache |
| `groundBound` | Clamp the orbit above the horizon. True for things that sit on a floor, false for things you pick up |
| `zoneTints` | Per-zone colour multipliers, for single-mesh models |
| `snapshotRef` | Set to capture the current frame as a PNG data URL |

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
