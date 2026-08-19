---
title: Motion API
summary: Every motion token and selector, what it sets and where it lives. Written by hand - this is a stylesheet convention, not a component with props.
---

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Anything that travels: opens, lifts, slides. |
| `--glass` | `color-mix(in srgb, var(--nori-700) 62%, transparent)` | A frosted surface's fill. |
| `--glass-edge` | `color-mix(in srgb, var(--rice) 9%, transparent)` | The lit top edge on a glass surface. |
| `--glass-blur` | `blur(18px) saturate(130%)` | `backdrop-filter`, applied once per surface, never nested. |

Plain `ease`, not a custom token, is used for colour transitions - colour
has no momentum, and `--ease-out`'s long tail on a hue change reads as a
delay rather than as motion.

## Selectors

| Selector | Defined in | Does |
| --- | --- | --- |
| `[data-reveal]` | `scroll-reveal.css` | The transition: opacity and transform, 700ms, `--ease-out`. |
| `[data-reveal="out"]` | `scroll-reveal.css` | Hidden state: `opacity: 0`, `translateY(18px)`. |
| `[data-reveal="in"]` | `scroll-reveal.css` | Shown state: `opacity: 1`, no transform. |
| `.logo-stage` | `atoms.css` | Carries `perspective`, on the parent of whatever turns. |
| `.logo-spin` | `atoms.css` | Carries `transform-style: preserve-3d` and `will-change: transform`, on the element that turns. |

## Notes

Every rule in this list is reduced-motion aware on its own - there is no
single switch that disables "motion" as a category. `[data-reveal="out"]`
resolves to the shown state under the preference rather than staying hidden,
because a scroll animation that never plays must not also hide its content.
Anything added to this list needs its own `@media (prefers-reduced-motion:
reduce)` block; there is nothing here that provides one for free.

`will-change: transform` is set on `.logo-spin` specifically and not
inherited by anything using `--ease-out` elsewhere. It costs a compositor
layer per element it is applied to, so it stays on the one thing that is
actually driven at 60fps rather than on every animated element in the sheet.
