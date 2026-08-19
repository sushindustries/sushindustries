---
title: Guides
summary: Using Product Viewer well, and the mistakes that look like it is broken.
---

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

## One canvas, and the variants that shape it

`logo.glb` carries `KHR_materials_variants` with four appearances in it -
Original, White, Black and Nothing - so this is one file being asked to look
four ways, rather than four files. Pass the name to `variants` and the model
brings its own materials:

<!-- ::start:showcase demo="product-variants" height="420" -->
<!-- ::end:showcase -->

`listVariants(gltf)` in `@sushindustries/product-viewer` reads the names out of
a model rather than requiring you to know them, and `missingVariants` tells you
which of the ones you asked for the file does not have - which is the check
worth running in CI, because a variant name that does not exist fails silently
and renders the default.


There is exactly one `<Canvas>` in this package, in
`elements/model-viewer/`. There were briefly two - the same component being
split out to sit beside its own stylesheet, types and stories, while the
original stayed where it was - and they drifted precisely as far as you would
expect. `modelRef`, `fit`, `controls`, `shadows` and `pivot` existed only in
one; `scroll` and its hint only in the other; `ModelCard` used one and
everything else used the other.

**Two implementations of one component is not a refactor in progress, it is a
bug with a schedule.** A fix to the canvas landed in whichever file the person
happened to open. `ProductViewer` is now an alias for `ModelViewer`, kept
because renaming a public API to tidy an internal one is a cost paid by other
people.

Everything the canvas can be is a prop, and every one of them is a thing that is
right somewhere and wrong somewhere else:

| Variant | Default | Right when | Wrong when |
| --- | --- | --- | --- |
| `scroll` | `zoom` | somebody opened this deliberately | it is in the flow of a document - the page cannot be scrolled past |
| `transparent` | `false` | a mark on a page. Also drops the loading scrim | a product that needs a ground and an honest edge |
| `controls` | `true` | a product people turn over | the canvas is inside a button. Controls take the pointerdown and the click never lands |
| `shadows` | `true` | anything with a ground under it | below ~100px, where it is four pixels of grey and a second render target |
| `fit` | `false` | the box's shape is not known in advance - an icon, a resizable panel | a camera somebody placed deliberately |
| `pivot` | `base` | shadows and grid must land where it meets the ground | anything rotating - see below |
| `grid` | `false` | a scene with a real-world scale | a mark |
| `groundBound` | `true` | it sits on a floor | you pick it up and look underneath |

> [!CAUTION] `pivot` is why a rotating model orbits instead of spinning
> `base` rests the model on `y=0`, so the whole mass sits **above** the axis and
> a Y rotation swings it around the origin like a fairground ride. Anything
> driving `modelRef` wants `pivot="center"`.

> [!CAUTION] `fov` is vertical, and that is the whole trap
> The default camera is placed for a landscape canvas. On a square one the
> horizontal field of view collapses to match the vertical, so the same model
> overflows the frame. It reads as "the model is blurry" or "the model is not
> rendering", and neither is what is happening. That is what `fit` is for.

Two of these are also CSS, because the DOM has to know:

```css
/* No controls means nothing here to point at, so pointers pass through to
   whatever this is sitting inside. */
.pv-viewer[data-controls='false'] { pointer-events: none; touch-action: auto; }

/* A transparent viewer is drawn on the page, so the loading scrim must not
   paint the very rectangle that mode exists to avoid. */
.pv-viewer[data-transparent='true'] .pv-progress { background: transparent; }
```

Attributes rather than modifier classes, throughout. An attribute travels with
the component, cannot be applied without its base, and is visible in the props
rather than in a stylesheet somebody has to go and find.

## Ready-made compositions

Reach for these before reaching for the canvas. Each is the same `ModelViewer`
with a set of those variants already chosen, and the reasons written down.

| Element | Import | What it is |
| --- | --- | --- |
| `ModelViewer` | `.../model-viewer` | the canvas. Give it a size and it fills it |
| `ModelCard` | `.../model-card` | a picture until somebody activates it. No WebGL in a grid of forty |
| `ModelMark` | `.../model-mark` | a model at icon size, over a glyph that never gets removed |

Each has its own entry point on purpose, so a page that imports the card does
not download the mark, and a page that imports neither does not download three.

## Props worth knowing

| Prop | Does |
| --- | --- |
| `model` | The GLB and its real-world size |
| `variants` | GLB material variants to apply, in order |
| `gltf` | An already-loaded asset, when something else owns the cache |
| `groundBound` | Clamp the orbit above the horizon. True for things that sit on a floor, false for things you pick up |
| `zoneTints` | Per-zone colour multipliers, for single-mesh models |
| `snapshotRef` | Set to capture the current frame as a PNG data URL |
| `modelRef` | The group holding the model, so something outside can turn it |
| `transparent` | No background node and an alpha buffer, so the page shows through |
| `controls` | Orbit controls. Off makes the canvas pointer-transparent, so it can live inside a button |
| `shadows` | The contact shadow. Off below roughly 100px, where it is four pixels of grey |
| `fit` | Frame the camera to the model instead of to a fixed position |
