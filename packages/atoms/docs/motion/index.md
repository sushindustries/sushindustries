---
title: Motion and depth
summary: Every transition, animation and perspective in the stylesheet, what each is for, and where it is used.
---

There are about a dozen moving things on this site. This is all of them, why
each moves at the speed it does, and which file to open.

The rule underneath the whole list: **motion answers a question the reader just
asked.** A panel opening was asked for by a press. A card lifting answers "is
this clickable". Nothing here moves to be noticed.

<!-- ::start:spacer size="6" rule="true" -->
<!-- ::end:spacer -->

## The one easing token

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
```

One curve, used for everything that travels. It starts fast and settles slowly,
which is how a thing that was pushed behaves, and the long tail is what makes
an interface feel unhurried without actually being slow.

Plain `ease` is used for colour changes, because a colour does not have
momentum and giving it some reads as a delay.

## Durations, and why they differ

Duration is a function of distance and of how often the control is used, not of
taste.

| Where | Duration | Why that number |
| --- | --- | --- |
| Colour on hover | 160ms | Under ~200ms a colour change reads as instant-but-soft. Longer and the interface feels like it is thinking |
| Card lift | 260ms | It moves 2px. Short travel, but it should feel like weight rather than a twitch |
| Nav chevron | 220ms | Rotates 180°, so it is travel, not a state flip |
| Nav panel in | 220ms | Appears in place. It grows into position rather than arriving from somewhere |
| Mobile drawer | 420ms | Crosses the whole screen. A full-screen surface arriving in 200ms reads as a page change, not as something opening |
| Reveal on scroll | 700ms | Not a response to a press. It is scenery, and scenery that hurries draws attention it did not earn |
| Showcase width | 320ms | The width change *is* the information - it has to be legible |

<!-- ::start:spacer size="6" label="No transition" -->
<!-- ::end:spacer -->

## Where motion is deliberately absent

The device toggle in `Showcase` has no transition at all.

It gets pressed a dozen times while reading one page, and on a control used
that often an animation reads as lag rather than as polish. The state change is
the feedback; anything added on top is a wait.

That is the general test: **how many times will this be seen in a session?**
Once or twice, animate it. Twenty times, do not.

## Depth: `perspective`

```css
.logo-stage {
	perspective: 1100px;
}

.logo-spin {
	transform-style: preserve-3d;
	will-change: transform;
}
```

Two properties, and which element carries which is the whole trick.

**`perspective` goes on the parent, not on the thing that turns.** On the
parent it establishes one vanishing point for the whole stage, so a mark
rotating inside it turns about the centre of the space it occupies - like an
object in a box. Put `perspective()` in the child's own transform instead and
each element gets its own vanishing point at its own centre, and a row of them
all splay outward.

**1100px is the viewing distance.** Smaller is a wider lens: more dramatic,
more distortion, and at very small values the near edge swings past the camera
and inverts. Larger flattens toward orthographic. Roughly the width of the
element is a sane starting point, and this stage is ~460px, so 1100px is a
gentle lens.

**`transform-style: preserve-3d`** keeps children in the same 3D space as their
parent rather than flattening them into a picture. Without it a nested
transform is composited to a plane first and the depth disappears.

**`will-change: transform`** promotes the element to its own compositor layer
so a per-frame transform does not repaint. It is deliberately on one element:
`will-change` costs memory per layer, and applying it broadly is how a page
gets slower by being told to go faster.

> [!CAUTION] Perspective is not free composition
> A `perspective` ancestor, like `backdrop-filter` and `transform`, becomes the
> containing block for `position: fixed` descendants. A fixed overlay inside a
> perspective stage will measure itself against the stage. That exact bug
> - via `backdrop-filter` on the header - made the mobile drawer sixty pixels
> tall.

## Glass, and the blur budget

```css
--glass: color-mix(in srgb, var(--nori-700) 62%, transparent);
--glass-edge: color-mix(in srgb, var(--rice) 9%, transparent);
--glass-blur: blur(18px) saturate(130%);
```

Frosted surfaces are three things: a translucent fill, a lit top edge, and a
blur. The **edge does most of the work** - a gradient from a faint light at the
top fading out by halfway is what separates "sheet of glass" from "translucent
box", and it costs one gradient.

**One blur per surface.** `backdrop-filter` makes its element a backdrop root
and forces a GPU readback every frame. They nest and multiply: eighteen blurred
icon tiles inside a blurred panel inside a blurred header crashed the renderer
outright, error code 5.

| Surface | Fill | Edge | Blur |
| --- | --- | --- | --- |
| Header | yes | yes | yes - it is over the page |
| Nav panel | yes | yes | yes - it is over the page |
| Mobile drawer | opaque | no | **no** - it sits over a 62% scrim, so the blur composited something already hidden |
| Card | yes | yes | **no** - it is a surface *on* the page, with nothing behind it worth blurring |
| Icon tile | yes | yes | **no** - a 34px tile gains nothing, and there are eighteen |

## Reduced motion

Every animated thing here checks `prefers-reduced-motion: reduce` and stops.

The important half is what it degrades *to*. A `Reveal` that respects the
preference shows its children immediately; leaving them hidden turns an
accessibility setting into a blank page. `useScrollTurn` fires once at the
current position rather than never, so whatever it drives is left in a sensible
pose rather than at zero - a model parked at rotation zero may be showing you
its back.

## Where each one lives

| Motion | Defined in | Used by |
| --- | --- | --- |
| `[data-reveal]` fade and rise | `atoms.css` | `Reveal`, `Section` |
| `.logo-stage` perspective | `atoms.css` | `ScrollSpin`, the home page hero |
| Scroll-driven rotation | `use-scroll-turn.ts` | `ScrollSpin` (CSS), `logo-model.tsx` (three.js) |
| `nav-panel-in` | `atoms.css` | `NavBar` desktop panels |
| `nav-sheet-in`, `nav-scrim-in` | `atoms.css` | `NavBar` mobile drawer |
| Burger bars to cross | `atoms.css` | `NavBar` toggle |
| Card lift | `atoms.css` | `Card`, archive cards |
| Frame width | `atoms.css` | `Showcase` viewport switch |
