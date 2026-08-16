---
title: Boot Loader
summary: A count to a hundred that stalls at ninety until the thing it is covering has actually arrived.
---

A machine booting: a mark, a number, and a rule.

<!-- ::start:showcase demo="boot-loader" height="340" -->
<!-- ::end:showcase -->

## The number is not a measurement, and that is the point

Nothing on this page can report real progress. A GLB has either arrived or it
has not; a font either is or is not. A number derived from bytes would jump
from 0 to 100 with nothing in between, which is worse than no number.

So this eases to **90 on a timer**, waits there for `ready`, then runs to 100.

That makes it honest in a different way. The number is a promise about
*attention* rather than about bytes - it says something is happening and
roughly how long is left - and it can never claim to be finished while the
thing it covers has not arrived.

```tsx
<BootLoader ready={modelLoaded} onDone={reveal}>
	<SpinningMark />
</BootLoader>
```

| Without `ready` | With it |
| --- | --- |
| Finishes on schedule whether or not anything loaded | Cannot reach 100 until the work reports in |
| The reveal shows an empty canvas | The reveal shows the thing |

> [!NOTE] Ninety, not ninety-nine
> A counter parked on 99 reads as stuck. One at 90 reads as nearly there, and
> the last tenth is where the eye expects a pause anyway.

## It fills its parent, never the viewport

On this site it boots a *screen* - the desktop inside a device, not the page
around it.

A loader that covered the browser window would hide the article somebody is
already reading in order to announce that a decoration further down is not
ready. `position: absolute; inset: 0` puts it inside whatever box you give it,
which needs a positioned ancestor and gets one from `.device-screen`.

<!-- ::start:spacer size="6" rule="true" -->
<!-- ::end:spacer -->

## Three details that are easy to get wrong

<!-- ::start:grid min="15rem" gap="4" -->

**`tabular-nums`** so 1 is as wide as 8. Without it a counter shifts sideways on
almost every frame, and nobody can name what is wrong - only that it looks
cheap.

**`scaleX`, not `width`** on the rail. A transform composites on its own layer;
a width relays out the page sixty times a second, competing with the WebGL
context it is covering for.

**A beat at a hundred** before it leaves. Replace the number in the same frame
it becomes correct and nobody ever sees it finish, which is the one moment this
component exists for.

**`onDone` in a ref**, so an inline arrow function from the parent does not tear
down and rebuild the animation loop on every render - which would leave the
count stuck at zero forever.

<!-- ::end:grid -->

## Reduced motion keeps it

The flourish goes; the loader stays.

Removing it entirely would be worse than useless. Somebody who asked for less
motion still needs to know something is happening, and a blank screen with no
explanation is not less motion - it is less information.

## Props

| Prop | Type | What it does |
| --- | --- | --- |
| `children` | `ReactNode` | Drawn in the square stage above the counter |
| `duration` | `number` | Roughly how long a run takes. Default 1600ms |
| `ready` | `boolean` | Until true, the count stalls at 90 |
| `onDone` | `() => void` | Called once it has reached 100 and faded |
| `label` | `string` | Read out instead of the number, which is meaningless spoken |

## Accessibility

`role="status"` and not `alert` - something loading is not an interruption.
`aria-busy` is what actually says "wait", and the digits are `aria-hidden`
because "zero four seven" is not information. The label carries the meaning.
