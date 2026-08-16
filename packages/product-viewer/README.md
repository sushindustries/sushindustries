# @sushindustries/product-viewer

A 3D product viewer, framework-free half. Everything here is plain three.js —
no React, no renderer, no assumption that a browser is running one.

That is what lets the same code validate a catalogue at build time and drive a
viewer at runtime.

## Install

```bash
pnpm add @sushindustries/product-viewer three
```

## Use

```ts
import { loadProductModel, applyVariant } from "@sushindustries/product-viewer";

const model = await loadProductModel({ url: "/models/chair.glb" });

applyVariant(model, "walnut");
```

## Optional peers stay optional

Two dependencies are deliberately kept out of the main entry point:

| Subpath | Peer | For |
| --- | --- | --- |
| `/schema` | `zod` | validating a product catalogue |
| `/zoned-material` | `three-custom-shader-material` | per-zone tinting on a single mesh |

A consumer who only renders models installs neither and ships neither.
Importing either subpath is the moment you opt in — which is the whole reason
they are not re-exported from the root.

## What it does

| Export | Does |
| --- | --- |
| `loadProductModel` / `disposeProductModel` | load a GLB, and free the GPU memory again |
| `applyVariant` / `listVariants` / `missingVariants` | GLB material variants, and telling you which ones a model is missing |
| `defineZoneScheme` / `computeZoneAttribute` | split one mesh into tintable zones |
| `threeDModelJsonLd` | `3DModel` structured data for the page the model sits on |

`missingVariants` exists because a catalogue and a model drift apart quietly.
Asking the model which variants it actually has, at build time, turns that into
a failed build instead of a beige sofa.

## Disposal is not optional

three.js does not garbage-collect GPU memory. `loadProductModel` has a matching
`disposeProductModel`, and a viewer that mounts and unmounts without calling it
leaks until the tab is closed.
