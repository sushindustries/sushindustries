---
title: API
summary: Every prop on ScrollSpin, including what it does under reduced motion.
---

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Whatever should turn |
| `revolutions` | `number` | `2` | Viewport heights per full turn. Higher is slower |
| `tilt` | `number` | `8` | Degrees of X-axis wobble. `0` for a flat turntable |

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
