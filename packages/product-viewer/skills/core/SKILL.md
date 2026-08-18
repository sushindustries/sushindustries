---
name: core
description: >
  How @sushindustries/product-viewer stays framework-free three.js: the
  opt-in subpath entries (/schema needs zod, /zoned-material needs
  three-custom-shader-material), why disposeProductModel is mandatory, and
  using missingVariants to fail a build instead of shipping a beige sofa.
  Load when loading GLB models outside React, validating a catalogue at
  build time, or applying material variants.
metadata:
  type: core
  library: '@sushindustries/product-viewer'
  library_version: '0.1.0'
sources:
  - 'sushindustries/sushindustries:packages/product-viewer/README.md'
---

## Setup

```bash
pnpm add @sushindustries/product-viewer three
```

```ts
import { loadProductModel, applyVariant } from "@sushindustries/product-viewer";

const model = await loadProductModel({ url: "/models/chair.glb" });

applyVariant(model, "walnut");
```

## Core Patterns

### Framework-free is the point

Everything here is plain three.js - no React, no renderer, no assumption that
a browser is running one. The same code validates a catalogue at build time
and drives a viewer at runtime. If the task is rendering inside React, reach
for `@sushindustries/react-product-viewer` instead; this package is the half
it is built on.

### Optional peers live behind subpaths, on purpose

| Subpath | Peer | For |
| --- | --- | --- |
| `/schema` | `zod` | validating a product catalogue |
| `/zoned-material` | `three-custom-shader-material` | per-zone tinting on a single mesh |

Neither subpath is re-exported from the root. Importing one is the moment a
consumer opts in to its peer dependency - a consumer who only renders models
installs neither and ships neither. Do not "fix" this by re-exporting them.

### Every load has a matching dispose

three.js does not garbage-collect GPU memory. `loadProductModel` has a
matching `disposeProductModel`, and a viewer that mounts and unmounts without
calling it leaks GPU memory until the tab is closed.

```ts
const model = await loadProductModel({ url });
// ... when done with it, always:
disposeProductModel(model);
```

### Ask the model what it has, at build time

A catalogue and a model drift apart quietly. `missingVariants` asks the GLB
which material variants it actually contains, so a catalogue that names a
variant the model lost becomes a failed build instead of a silently wrong
render.

```ts
import { missingVariants } from "@sushindustries/product-viewer";

const missing = missingVariants(model, catalogue.variants);
if (missing.length > 0) throw new Error(`model lacks: ${missing.join(", ")}`);
```

`listVariants` returns what the model has; `applyVariant` switches to one.

### Structured data ships with the model

`threeDModelJsonLd` produces `3DModel` JSON-LD for the page the model sits
on. Use it rather than hand-writing the schema.org object.

## Common Mistakes

- **Skipping `disposeProductModel`** - nothing errors, the tab just holds GPU
  memory forever. Every load path needs a dispose path.
- **Importing `/schema` or `/zoned-material` without their peers installed** -
  the peers are intentionally not dependencies; install `zod` or
  `three-custom-shader-material` alongside the import.
- **Trusting the catalogue over the model** - validate with
  `missingVariants` in a build step; the model is the source of truth for
  which variants exist.
