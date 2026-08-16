---
title: useScrollTurn
summary: Scroll position as a rotation, delivered once per frame, written straight to wherever it goes.
---

The measurement behind `ScrollSpin`, on its own, because the same numbers have
to drive two things that share no code.

<!-- ::start:showcase demo="use-scroll-turn" height="420" -->
<!-- ::end:showcase -->

## Why it is a hook and not just part of ScrollSpin

`ScrollSpin` writes a CSS transform. The hero on the home page writes a
three.js object's rotation, because a CSS `rotateY` on a canvas spins the
rendered image like a photograph rather than turning the model inside it.

Two completely different write targets, one question: how far has this page
turned. Sharing the measurement means a screenful of scrolling turns the CSS
mark and the GLB by the same amount, which is the sort of agreement that
silently stops being true the moment it is written twice.

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

## Revolutions are viewport heights

`revolutions` is how many screens of scrolling make one full turn, not how many
pixels. In pixels a phone would spin four times over the same content a desktop
turns once, because the content is the same and the screen is not.

## Reduced motion

Under `prefers-reduced-motion: reduce` the callback fires once, at the current
position, and never again.

Once, rather than never: that leaves whatever it drives in a sensible still
pose rather than at zero, which matters because zero is a value nobody chose -
a model parked at rotation zero may be showing you its back.

## Where this is used

| Where | Writes to |
| --- | --- |
| `ScrollSpin` | a CSS transform on a wrapper element |
| `apps/web/src/modules/chrome/logo-model.tsx` | `rotation.y` on the hero's GLB |
