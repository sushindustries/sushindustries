---
title: Smooth Scroll API
summary: What it takes, what it gives back, and what it does between.
---

<!-- generated:api -->

## Signature

```ts
SmoothScroll(): null
```

<!-- /generated:api -->

## Notes

No props, on purpose - `duration` (1.1s) and `smoothWheel` are fixed in the
source rather than exposed, because this site has one scroll feel, not a
per-page one. It mounts inside a `useEffect` rather than at module scope, so
the `window` and `document` it touches immediately are never reached during
a server render; the effect also means reduced-motion users never construct
a `Lenis` instance at all; they get the native scroll from the first frame.
