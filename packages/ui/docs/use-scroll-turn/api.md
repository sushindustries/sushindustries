---
title: useScrollTurn API
summary: What it takes, what it gives back, and what it does between.
---

<!-- generated:api -->

## Signature

```ts
useScrollTurn(onTurn: (value: ScrollTurn) => void, { revolutions = 2, tilt = 8 }: ScrollTurnOptions = {}): void
```

Scroll position as a rotation, delivered once per frame. The callback runs inside `requestAnimationFrame` and is expected to write somewhere directly - a DOM node's transform, a three.js object's rotation. Nothing here holds state, because at 60fps a state-driven version re-renders its subtree on every frame of every scroll, which is the one reliable way to make a light page feel heavy. A plain passive scroll listener rather than a Lenis subscription, so this works with or without smooth scrolling: when Lenis is mounted it is already driving the native scroll position, so `scrollY` is the smoothed value either way, and when it is not this still works. Under `prefers-reduced-motion: reduce` the callback fires once, at the current position, and never again. That leaves whatever it drives in a sensible still state rather than at zero, which matters when zero is not a pose anyone chose.

<!-- /generated:api -->

## Notes

`onTurn` is an effect dependency along with `revolutions` and `tilt` - wrap
it in `useCallback`, or the scroll listener is torn down and rebuilt on
every render of whatever calls this hook.

`tilt: 0` is a legitimate way to ask for a flat turntable with no wobble at
all; `wobble` is still computed and passed every frame, it is simply always
zero. There is no way to get `turn` without `wobble` in the callback shape -
read only the field that matters and ignore the other.
