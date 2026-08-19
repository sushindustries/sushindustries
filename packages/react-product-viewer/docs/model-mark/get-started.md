---
title: Get Started
summary: Install the viewer package, then import from its model-mark subpath - never from the root.
---

## Install

```shell
pnpm add @sushindustries/react-product-viewer three @react-three/fiber @react-three/drei three-stdlib
```

There is no registry entry for this - it ships from its own package rather
than `packages/ui`, so there is no TanStack or shadcn command to run
alongside it.

## Use it

```tsx
import { Icon } from "@sushindustries/ui";
import { ModelMark } from "@sushindustries/react-product-viewer/model-mark";

export function Example() {
	return (
		<ModelMark
			model={{ url: "/models/logo.glb", realLength: 1 }}
			glyph={<Icon name="sushi" size={30} />}
			label="Sushindustries"
			seconds={18}
		/>
	);
}
```

The import comes from `/model-mark`, not from the package root - the root
statically imports the full viewer, and importing from there would put
three's ~600 kB back into every page that names a mark.

## What you should see

The glyph, immediately - a flat icon, exactly as if `ModelMark` were not
there at all. A moment later, once the GLB has downloaded and WebGL has
initialised, a small 3D canvas fades in over it and starts turning slowly.
The glyph never disappears; the canvas paints over it.

## If nothing happens

If only the glyph ever shows and the canvas never arrives, check
`prefers-reduced-motion` first - under that preference no canvas mounts at
all, by design, and the glyph alone is the correct result rather than a
bug. Failing that, check the model URL: a 404 or a WebGL context refusal
also leaves the glyph as the only thing on screen, silently, because the
canvas simply never becomes `live`.
