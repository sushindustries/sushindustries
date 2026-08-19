---
title: useScrollTurn
summary: Scroll position as a rotation, delivered once per frame, written straight to wherever it goes.
---

The measurement behind `ScrollSpin`, on its own, because the same numbers have
to drive two things that share no code.

<!-- ::start:showcase demo="use-scroll-turn" height="420" -->
<!-- ::end:showcase -->

## Never through state

```tsx
useScrollTurn(({ turn, wobble }) => {
	node.style.transform = `rotateY(${turn * 360}deg)`;
});
```

The callback runs inside `requestAnimationFrame` and is expected to write
somewhere directly. Nothing here holds state, because at 60fps a state-driven
version re-renders its subtree on every frame of every scroll, which is the one
reliable way to make a light page feel heavy.

The same reasoning is why `ProductViewer` takes a `modelRef` rather than a
`rotation` prop: a prop would re-render the whole viewer sixty times a second
to change one float React has no reason to know about.

> [!IMPORTANT] Wrap the callback in `useCallback`
> It is a dependency of the effect. An inline arrow function is a new
> function on every render, so the listener is torn down and rebuilt every
> time anything above it changes.

## Where this is used

| Where | Writes to |
| --- | --- |
| `ScrollSpin` | a CSS transform on a wrapper element |
| `apps/web/src/modules/chrome/logo-model.tsx` | `rotation.y` on the hero's GLB |
