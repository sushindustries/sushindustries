---
title: Model Mark API
summary: Every prop, and the motion functions beside it. Written by hand - this element has no registry entry to generate from.
---

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `model` | `ModelConfig` | - | The GLB and its real-world size. |
| `glyph?` | `ReactNode` | - | Drawn underneath the canvas, and never removed - what shows before the model loads, if it fails, and under reduced motion. |
| `seconds?` | `number` | `14` | Seconds per full cycle. Higher is slower. |
| `motion?` | `MarkMotion` | `"spin"` | `"spin" \| "sway" \| "tumble" \| "still"`. See Motions below. |
| `spinAnyway?` | `boolean` | `false` | Turn even under reduced motion. Should stay off - a stationary 3D model at icon size is a worse, more expensive glyph. |
| `className?` | `string` | - | Added after the built-in `pv-mark` class. |
| `style?` | `CSSProperties` | - | In practice, `--pv-mark-size`. |
| `label?` | `string` | - | `aria-label` on the wrapping `role="img"` element - required in practice, since the canvas contributes nothing to the accessibility tree. |

## Motions

```ts
type MarkMotionFn = (seconds: number, period: number) => { x: number; y: number; z: number };

const MARK_MOTIONS: Readonly<Record<MarkMotion, MarkMotionFn>>;

function applyMotion(rotation: Euler, motion: MarkMotion, seconds: number, period: number): void;
```

Each entry in `MARK_MOTIONS` is a pure function of elapsed seconds and the
`seconds` prop's period - no canvas required to call one, and a fifth motion
is a function added to this map rather than a fork of the element.
`applyMotion` writes the result straight onto a three `Euler` in place,
which is how `ModelMark` avoids a `rotation` prop re-rendering the viewer
sixty times a second.

## useMarkSpin

```ts
useMarkSpin(seconds: number, spinAnyway: boolean, motion: MarkMotion): MarkSpin
```

Returns `{ modelRef, live }`. `live` is `false` until the canvas should
mount - never under reduced motion unless `spinAnyway` is set - and `true`
otherwise. `modelRef` is what the animation frame loop writes rotation onto.

## Notes

`model` takes the same `ModelConfig` shape as `ProductViewer` - a URL and a
`realLength` - because `ModelMark` mounts the same viewer underneath, fitted
and stripped down for icon size rather than rebuilt.

There is no prop for `pivot`, `controls`, `shadows`, `fit` or `groundBound`.
`ModelMark` sets all five itself: `pivot="center"` so the model spins on the
spot rather than orbiting the origin, and the rest off or fitted, because
none of them are meaningful choices at icon size - see the guides tab for
why each one would be wrong here.
