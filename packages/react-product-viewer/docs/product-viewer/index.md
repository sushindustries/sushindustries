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

## One canvas, and the variants that shape it

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

## It is not only a hero

The viewer fills its container and has no opinion about how big that is. That
is a deliberate refusal, and it is what lets the same component be a full-width
hero, a card thumbnail, and a **48px icon** with no mode switch and no second
build of it.

Three props do the work, and each of them is a thing that is right for a hero
and wrong for an icon:

```tsx
<ProductViewer
	model={{ url: "/models/logo.glb", realLength: 1 }}
	modelRef={modelRef}
	transparent
	groundBound={false}
	// The canvas is inside a button. OrbitControls takes the pointerdown and
	// the click never reaches the control around it, so the icon would spin
	// and refuse to open. Off also sets pointer-events: none on the viewer.
	controls={false}
	// A contact shadow at 48px is four pixels of grey, and it is a second
	// render target re-baked every frame while the model is turning.
	shadows={false}
	// The default camera is placed for a landscape box, and `fov` is
	// *vertical* - so at 1:1 the horizontal field of view is much narrower
	// and a model that fits the hero overflows the icon. This measures the
	// model and fits the camera to it, re-fitting when the canvas resizes.
	fit
/>
```

> [!CAUTION] `fov` is vertical, and that is the whole bug
> A camera tuned on a wide canvas looks completely correct until the same
> component is put in a square one, where the horizontal field of view collapses
> to match the vertical. The model does not move; the frame closes in on it. It
> reads as "the model is blurry" or "the model is not rendering", and neither
> is what is happening.

And four things are the host's job, not the package's:

```css
.mark {
	/* 1. A size. The viewer measures its host; a host with no width takes
	      the whole tile and then keeps taking it. */
	width: 3rem;
	height: 3rem;
	/* 2. A clip. A model whose bounding box is larger than its silhouette
	      would otherwise paint over the label under it. */
	overflow: clip;
}

/* 3. Silence the progress scrim. It paints an overlay and a 4px blur, which
      is right on a white card and is a grey square on a dark desktop. */
.mark .pv-progress {
	background: transparent;
	backdrop-filter: none;
}

/* 4. Drop the progress label. There is no room, and it is in the aria-label. */
.mark .pv-progress__label {
	display: none;
}
```

None of those are bugs in the package. A scrim behind a spinner is correct for
a product arriving on a card; it is the *host* that knows its surface is dark
and 48px wide, which is the same reason the package refuses to have an opinion
about size in the first place.

### Turning it on a clock

`modelRef` is how anything outside drives the rotation, and it is a ref rather
than a `rotation` prop for one reason: whatever drives it is doing so per
frame, and a prop would re-render the whole viewer sixty times a second to
change a number React has no reason to know about.

```tsx
const modelRef = useRef<Group>(null);

useEffect(() => {
	// Reduced motion means a still mark, not a slower one.
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

	let frame = 0;
	const started = performance.now();

	function tick(now: number) {
		const group = modelRef.current;
		// Elapsed time, not a per-frame increment: a dropped frame then loses
		// no rotation, and a backgrounded tab does not return a quarter turn
		// behind where it should be.
		if (group) group.rotation.y = ((now - started) / 14000) * Math.PI * 2;
		frame = requestAnimationFrame(tick);
	}

	frame = requestAnimationFrame(tick);
	return () => cancelAnimationFrame(frame);
}, []);

<ProductViewer model={model} modelRef={modelRef} transparent groundBound={false} />;
```

OrbitControls still owns the camera, so turning the model this way and dragging
to look at it compose rather than fight.

> [!NOTE] A glyph is still declared behind it
> On this site the live mark is a desktop icon, and the entry it belongs to
> still names an ordinary glyph. That glyph is what renders before the GLB
> arrives, in a search result where there is no canvas, and for anybody who
> asked for reduced motion. A live icon is an enhancement of a real one, never
> a replacement for it.

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
