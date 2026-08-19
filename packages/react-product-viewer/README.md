# @sushindustries/react-product-viewer

[GitHub Packages](https://github.com/sushindustries/sushindustries/pkgs/npm/react-product-viewer)

The React adapter for `@sushindustries/product-viewer`. The core package holds
everything that is just three.js; this holds the component and the hooks.

See [Model Mark](/components/model-mark) for the icon-size variant this package
also exports.

## Install

```bash
pnpm add @sushindustries/react-product-viewer three @react-three/fiber @react-three/drei three-stdlib
```

## Use

```tsx
import { lazy, Suspense } from "react";

// Lazy, always. three and R3F are ~600 kB and cannot run on a server.
const ProductViewer = lazy(
	() => import("@sushindustries/react-product-viewer"),
);

export function Page() {
	return (
		<Suspense fallback={null}>
			<ProductViewer
				model={{ url: "/models/chair.glb", realLength: 0.9 }}
				variants={["walnut"]}
				groundBound
			/>
		</Suspense>
	);
}
```

`ProductViewer` is exported both by name and as the default. The default is not
a style choice — `React.lazy` requires one.

## Two TanStack integrations, both optional

Separate entry points, because both their peers are optional too:

```ts
// TanStack Query owns the asset, so a route loader can preload it —
// on hover, under defaultPreload: "intent" — and eviction frees the GPU.
import { productModelOptions } from "@sushindustries/react-product-viewer/query";

// TanStack Router owns the selection, so a configured product is a URL
// somebody can send.
import { useVariantSearch } from "@sushindustries/react-product-viewer/router";
```

The split matters. If Query owns the GLB, the model is already in memory before
the route renders, and the cache eviction you already configured is what frees
video memory. If Router owns the selection, "the chair in walnut" is a link.

## Styles

```ts
import "@sushindustries/react-product-viewer/styles.css";
```

Class names are prefixed `pv-`. Pass `className` to add your own.

## Components

| Export | Does |
| --- | --- |
| `ProductViewer` | the canvas, the lighting, the orbit controls |
| `ProductModel` | just the model, for when you own the canvas |
| `ProductHero` / `HeroInteractive` | a hero that stays still until interacted with |
| `ViewIn3D` / `useViewIn3D` | progressive enhancement from an image to the viewer |
| `VariantButton` / `useVariantSwatches` | swatches driven by the model's own variants |
| `ProductModelJsonLd` | `3DModel` structured data |

`ViewIn3D` is the one worth reading twice: it renders an image, and only pulls
the 3D bundle when someone asks for it. Most visitors never do.
