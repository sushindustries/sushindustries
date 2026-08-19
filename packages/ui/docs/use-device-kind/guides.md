---
title: Guides
summary: How the hook stays in step with the stylesheet, what an override changes, and where the numbers come from.
---

## It listens rather than measuring

```ts
window.matchMedia(`(min-width: ${device.from}px)`);
```

One `MediaQueryList` per machine, and the widest match wins - which is exactly
how the cascade resolves the same queries in `devices.css`.

Reading `innerWidth` would be one line and would disagree with the stylesheet
the moment a scrollbar exists: a media query measures the viewport *including*
the scrollbar, and `innerWidth` does not. That is a 15px window where the
number says one machine and the screen shows another, and it is the kind of
disagreement nobody finds by reading either file.

Listeners are removed on unmount, and none are attached at all when an override
is passed.

## An override short-circuits it

```tsx
useDeviceKind(settings.device === "auto" ? undefined : settings.device);
```

Passed a kind, it returns that kind and attaches nothing. This matches what the
stylesheet does with `data-device`, so a settings panel that writes the
attribute and reads this hook cannot end up with the two disagreeing.

## What it is generated from

Nothing here holds a number. `DEVICES` comes from
`packages/atoms/devices.md`, which is also what the media queries are compiled
from, so this hook is correct by construction rather than by somebody
remembering to update it twice.

| Export | What it is |
| --- | --- |
| `DEVICES` | every machine, narrowest first, with its `from`, `width` and `aspect` |
| `DEVICE_KINDS` | just the names, for a menu |
| `deviceKindFor(width)` | the same decision without touching the DOM |
| `deviceQuery(kind)` | the media query text, for anything doing its own matching |
