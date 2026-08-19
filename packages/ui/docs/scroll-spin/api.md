---
title: API
summary: Every prop on `ScrollSpin`, including what it does under reduced motion.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Whatever should turn. A logo, a mark, an image, a diagram. |
| `revolutions?` | `number` | `2` | Viewport heights per full revolution. Higher is slower. Tied to viewport height rather than pixels so the rotation per "screen scrolled" is the same on a phone and on a monitor. |
| `tilt?` | `number` | `8` | Degrees of wobble on the X axis. Set to 0 for a flat turntable. |

<!-- /generated:api -->

### `revolutions`

Measured in viewport heights, not pixels. A pixel constant would mean a phone
user scrolling one screen sees three times the rotation a desktop user sees for
the same gesture.

### `tilt`

The wobble is a sine of the same scroll value, so it returns to zero at every
half turn rather than drifting. Set it to `0` for a turntable; anything above
about `12` starts to read as a wobble rather than a tilt.

> [!CAUTION] It writes to `style.transform`
> Do not also animate `transform` on the same element from CSS. The component
> overwrites the property on every frame, and your keyframes will silently lose.
