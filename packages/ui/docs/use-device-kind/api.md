---
title: useDeviceKind API
summary: What it takes, what it gives back, and what it does between.
---

<!-- generated:api -->

## Signature

```ts
useDeviceKind(override?: DeviceKind): DeviceKind | null
```

The machine the window's width currently selects, or `null` before mount.

<!-- /generated:api -->

## Notes

Passing `override` is not the same as ignoring the return value - with an
override, no `matchMedia` listener is attached at all, so a component that
switches between "auto" and a forced device by toggling `override` on and off
also switches between listening and not listening, with no leftover
listener from the other mode.

There is no third state for "the environment cannot tell": `null` covers
both "not mounted yet" and "no `matchMedia` available", because both cases
call for the same fallback behaviour - use the narrowest machine's numbers,
never assume laptop.
