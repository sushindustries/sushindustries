---
title: Examples
summary: Product Viewer in something real, at every width it has to survive.
---

<!-- ::start:showcase demo="product-viewer" height="460" -->
<!-- ::end:showcase -->

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
