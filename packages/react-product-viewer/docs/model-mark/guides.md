---
title: Guides
summary: Using Model Mark well, and the mistakes that look like it is broken.
---

## The glyph is underneath, and it stays there

`glyph` is not a placeholder that gets swapped out on load. It is drawn in the
same grid cell and the canvas paints over it.

WebGL is the one part of a page that can fail for reasons the page does not
control: a driver, a context the browser refused, a machine with no GPU worth
the name. Left as a fallback that is *replaced*, every one of those is a blank
square. Left underneath, every one of them is an icon that does not spin.

It is also what shows under reduced motion, because no canvas is mounted then
at all - see below.

## `place-self: stretch` is load-bearing

This is worth stating on its own, because getting it wrong is a **silent, total
failure** rather than a visual one.

```css
.pv-mark > * {
	grid-area: 1 / 1;
	place-self: stretch; /* not `place-items: center` on the parent */
}
```

A grid item that is *centred* is sized to its content. The viewer inside asks
for `width: 100%` of that item. A percentage of a shrink-to-fit box that is
waiting on its own content resolves to **zero**.

The canvas is then 0x0. WebGL initialises happily, nothing is logged, no error
is thrown, and the element renders as an empty square that looks exactly like a
model which failed to load.

## Reduced motion mounts nothing

Not a slower spin, and not a still canvas.

A stationary 3D model at icon size is a worse version of the glyph already
underneath it, and it costs a WebGL context to be worse. So `useMarkSpin`
returns `live: false` and the element renders the glyph alone.

`spinAnyway` exists and should stay off.

## Motions are variants, and variants are pure functions

```tsx
<ModelMark motion="sway" seconds={18} model={model} />
```

| Motion | What it does | For |
| --- | --- | --- |
| `spin` | one axis, constant speed | the default. A thing on a shelf |
| `sway` | turns to face, overshoots, returns | a mark with a **front**. A spin spends half of every revolution edge-on and unreadable |
| `tumble` | two axes at rates that do not resynchronise | a mark with no front - a solid, a knot, a die |
| `still` | held at a three-quarter view | a resting state. Enough angle to read as a model, no movement |

Each is a pure function of elapsed seconds, exported as `MARK_MOTIONS`:

```ts
import { MARK_MOTIONS, applyMotion } from "@sushindustries/react-product-viewer/model-mark";

MARK_MOTIONS.spin(2, 8); // { x: 0, y: 1.57..., z: 0 }
```

Pure and time-based, and both halves earn their place. **Pure** means a motion
is testable, composable and reusable without a canvas anywhere near it - a
fifth motion is a function, not a fork of this element. **Time-based** means a
dropped frame loses nothing.

Two numbers in there are chosen rather than found, and both would look
arbitrary without saying so:

- `sway` turns a **quarter turn** each way. Enough to read as three-dimensional,
  little enough that nothing goes past its own silhouette.
- `tumble` runs its second axis at **1.6x**, not 1.5. At a simple fraction the
  two axes resynchronise every other cycle and the whole thing visibly loops.

The variant is `data-motion` on the element, never a second class name. An
attribute travels with the component, cannot be applied without its base, and
is visible in the props rather than in a stylesheet somebody has to find.

> [!NOTE] `still` is exempt from reduced motion
> Reduced motion is a request about movement, not about canvases. Treating
> `still` as motion would disable the one variant that already honours the
> preference.

## The pivot is why it spins rather than orbits

`ProductModel` rests the model's base on `y=0` by default, so contact shadows
and the grid land where it actually meets the ground. That is right for a
product and wrong for anything rotating: the whole mass then sits **above** the
axis, and a Y rotation swings the object around the origin like a fairground
ride instead of turning it on the spot.

```tsx
<ProductViewer pivot="center" /> // the origin at the middle of the bounding box
```

`ModelMark` sets it. There is no ground under an icon for the base to rest on,
so there is nothing traded away.

| `pivot` | Origin | For |
| --- | --- | --- |
| `base` | centred in X and Z, resting on y=0 | a product. Shadows and grid land correctly |
| `center` | the middle of the bounding box | anything that rotates |

## It turns on elapsed time

```ts
group.rotation.y = ((now - started) / (seconds * 1000)) * Math.PI * 2;
```

Not `rotation.y += 0.01`. A per-frame increment loses rotation on every dropped
frame, and a tab that was in the background comes back a quarter turn behind
where it should be. Nobody notices until they switch away and back.

Written straight onto the group through `modelRef`, never through state: a
`rotation` prop would re-render the whole viewer sixty times a second to change
one float React has no reason to know about.

## It has its own entry, and that is deliberate

```ts
import { ModelMark } from "@sushindustries/react-product-viewer/model-mark";
```

Not from the package root. `ModelMark` lazily imports the viewer from inside
itself, so a page that only names a mark ships no three until one becomes live.
The root imports the viewer *statically*, so importing from there would put
~600 kB straight back into the graph - and the bundler says so rather than
quietly undoing it:

```text
[INEFFECTIVE_DYNAMIC_IMPORT] src/product-viewer.tsx is dynamically imported by
src/elements/model-mark/model-mark.tsx but also statically imported by
src/index.ts
```

## Sizing

One custom property, because the size is almost always a stylesheet's decision:

```css
.site-mark {
	--pv-mark-size: clamp(2.75rem, 11cqi, 3.25rem);
}
```

A number prop could express none of `clamp`, a container query, or a media
query. `style` is the escape hatch for the one case where the caller really did
compute it.

## Props

| Prop | Type | What it does |
| --- | --- | --- |
| `model` | `ModelConfig` | The GLB and its real-world size |
| `glyph` | `ReactNode` | Drawn underneath, and never removed |
| `seconds` | `number` | Seconds per revolution. Default 14 |
| `spinAnyway` | `boolean` | Turn even under reduced motion. Leave it off |
| `label` | `string` | `aria-label`. The canvas contributes nothing to the accessibility tree |
| `className` | `string` | Added after `pv-mark` |
| `style` | `CSSProperties` | In practice, `--pv-mark-size` |
