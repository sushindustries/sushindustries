---
title: useDeviceKind
summary: Which machine the stylesheet is currently drawing, as a value. Null until mounted, on purpose.
---

`Device` renders every machine and lets media queries choose. This is for the
code that has to *say* which one won.

<!-- ::start:showcase demo="use-device-kind" height="260" -->
<!-- ::end:showcase -->

```tsx
const kind = useDeviceKind(); // "phone" | "tablet" | "laptop" | null
```

## Null is the answer, not a gap

It returns `null` until the first effect runs, and never guesses.

A default of `"laptop"` would be a claim the server cannot support. Every
caller would then have one render where the value is confidently wrong, and the
callers here are things like *"tell the model which machine the reader is
using"* - where confidently wrong is worse than absent by a wide margin.

Being `null` costs nothing in practice, because everything that needs this
needs it after a click.

> [!CAUTION] Do not use this to pick what to render
> That is the mistake this whole design exists to avoid. A tree chosen from
> this hook renders nothing on the server and the wrong thing on the first
> client frame. If the decision is visual, it belongs in the stylesheet -
> `data-device`, or a media query from `devices.md`.
