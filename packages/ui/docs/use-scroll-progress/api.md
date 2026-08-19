---
title: useScrollProgress API
summary: What it takes, what it gives back, and what it does between.
---

<!-- generated:api -->

## Signature

```ts
useScrollProgress(ref: RefObject<HTMLElement | null>, onProgress: (progress: number) => void, { finishAt = 0.55, whenVisible = true }: ScrollProgressOptions = {}): void
```

How far an element has travelled through the viewport, from 0 to 1. Different question from `useScrollTurn`, which asks how far the *page* has scrolled. This one is about one element: it reads 0 while the element is still below the fold and 1 once it has risen to `finishAt`, which is what you want for anything that should play as a thing arrives rather than continuously as the page moves. The callback runs in a `requestAnimationFrame` and is expected to write somewhere directly, for the same reason as `useScrollTurn`: sixty state updates a second re-render a subtree sixty times a second. An IntersectionObserver gates the listener rather than driving the value. Observers report crossings, not positions, so they cannot give a smooth progress - but they are the cheapest possible way to stop measuring an element nobody can see.

<!-- /generated:api -->

## Notes

`onProgress` should not be an inline arrow function - it is an effect
dependency, same as `ref`, `finishAt` and `whenVisible`, so a new function
every render tears down and rebuilds the scroll listener and the observer on
every render of whatever calls this hook. Wrap it in `useCallback`.

`finishAt` and `whenVisible` are independent: `whenVisible: false` still
respects `finishAt` for where progress reaches 1, it only changes whether the
listener runs while the element is off screen.
