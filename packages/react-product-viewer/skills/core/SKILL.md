---
name: core
description: >
  How to load @sushindustries/react-product-viewer without breaking SSR or
  shipping ~600kB to every visitor, the Query/Router split for asset
  ownership vs. selection state, and the icon-size ModelMark trap. Load when
  rendering a 3D product model, wiring variant selection to a URL, or
  placing a model at icon size.
metadata:
  type: core
  library: '@sushindustries/react-product-viewer'
  library_version: '0.1.0'
sources:
  - 'sushindustries/sushindustries:packages/react-product-viewer/README.md'
  - 'sushindustries/sushindustries:packages/react-product-viewer/docs/model-mark/index.md'
---

## Setup

```tsx
import { lazy, Suspense } from "react";

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

## Core Patterns

### Always lazy - three.js and R3F cannot run on a server

`ProductViewer` is exported both by name and as the default; the default
export exists because `React.lazy` requires one, not as a style choice.

### Query owns the asset, Router owns the selection

```ts
// preload the GLB on hover, evict it when the route leaves
import { productModelOptions } from "@sushindustries/react-product-viewer/query";

// "the chair in walnut" is a URL, not local state
import { useVariantSearch } from "@sushindustries/react-product-viewer/router";
```

Both entry points are optional and separate, because both of their peers
are optional too.

### `ViewIn3D` for progressive enhancement

Renders an image first, and only pulls the 3D bundle in when someone
actually asks for it - worth reaching for by default on a hero, since most
visitors never interact with the model.

## Common Mistakes

### [HIGH] Importing `ProductViewer` eagerly instead of through `lazy()`

Wrong:

```tsx
import { ProductViewer } from "@sushindustries/react-product-viewer";
```

at the top of a server-rendered page.

Correct: `const ProductViewer = lazy(() => import(...))`, rendered inside a
`Suspense` boundary.

three.js and `@react-three/fiber` are roughly 600kB and cannot run on a
server - an eager import either breaks server rendering outright or ships
that weight to every visitor regardless of whether they ever see the model.

Source: sushindustries/sushindustries:packages/react-product-viewer/README.md (Use)

### [MEDIUM] Keeping the selected variant in local component state only

Wrong: `const [variant, setVariant] = useState("walnut")`, with no
connection to the URL.

Correct: `useVariantSearch` from the `/router` entry point.

Without it, "the chair in walnut" isn't a link anyone can share, bookmark,
or reload into - the configuration disappears the moment the tab closes.

Source: sushindustries/sushindustries:packages/react-product-viewer/README.md (Two TanStack integrations)

### [MEDIUM] Rendering the full viewer directly on a hero instead of `ViewIn3D`

Wrong: `<ProductViewer ... />` placed directly where a hero image would go.

Correct: `<ViewIn3D ... />`, which renders an image and only loads the 3D
bundle on interaction.

Most visitors never rotate the model - paying the ~600kB viewer cost
upfront for a majority who never asked for it is the exact cost `ViewIn3D`
exists to avoid.

Source: sushindustries/sushindustries:packages/react-product-viewer/README.md (Components)

### [HIGH] Reusing `ModelViewer` at icon size instead of `ModelMark`

Wrong:

```tsx
<ModelViewer model={{ url: logoUrl, realLength: 1 }} />
```

placed inside a 48px icon slot.

Correct:

```tsx
import { ModelMark } from "@sushindustries/react-product-viewer/model-mark";

<ModelMark
	model={{ url: logoUrl, realLength: 1 }}
	glyph={<Icon name="sushi" size={30} />}
	label="Sushindustries"
/>;
```

`fov` is *vertical*, so a camera tuned for a wide, landscape canvas has a
far narrower horizontal field of view once placed in a square one - the
model reads as blurry or simply not rendering, and nothing about the error
points at the camera.

Source: sushindustries/sushindustries:packages/react-product-viewer/docs/model-mark/index.md
