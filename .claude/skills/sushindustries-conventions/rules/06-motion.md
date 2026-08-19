# 06 - motion

> Lenis drives page scroll. Scroll-linked animation writes transforms in a
> frame callback, never through React state.

## Rules

| Rule | Layer | Enforced by |
| --- | --- | --- |
| First render is identical on server and client | Official + Safety | `nobody` |
| Every animated component checks `prefers-reduced-motion` and stops | House | `nobody` |
| Reduced motion removes the flourish, never the information | House | `nobody` |
| Scroll-linked animation writes transforms in `requestAnimationFrame` | House | `nobody` |
| An inner scroll container carries `data-lenis-prevent` | House | `nobody` |
| Heavy islands import through the pacer | House | `nobody` |

Every rule here is enforced by `nobody`, which is worth saying out loud: this
is the surface where a regression is invisible to the gate and obvious to a
visitor. `layout.test.ts` renders with JavaScript off, so it proves the page
survives without motion - it cannot prove the motion is right.

## Hydration

First render must be identical on server and client. Decide visibility from an
effect, never from scroll position during render.

A component that reads `window`, `Date.now()`, a random id or a locale during
render has already broken this. The value arrives in an effect, or it does not
arrive on the first frame.

## Reduced motion

Every animated component checks `prefers-reduced-motion` and stops.

Stopping means **removing the flourish and keeping the information**. A
`Reveal` that respects the preference shows its children immediately; leaving
them hidden turns the preference into a blank page. A loader still loads. A
reveal still appears.

## Scroll

Scroll-linked animation writes transforms in a `requestAnimationFrame`
callback, never through React state - at 60fps a state-driven version
re-renders the subtree every frame.

Any `overflow: auto` container inside the page gets `data-lenis-prevent`, or
the smooth scroller fights it.

## Weight

Three-loading islands import through `paced-import.ts`: a pacer queue,
concurrency 1, started on idle. LCP wins, and viewers boot one at a time
instead of losing WebGL contexts.

## Before you finish

- [ ] The first frame is the same on both sides of hydration.
- [ ] `prefers-reduced-motion` was tested, and the page still says what it
      said.
- [ ] Nothing animates through React state.
- [ ] A new inner scroller has `data-lenis-prevent`.
