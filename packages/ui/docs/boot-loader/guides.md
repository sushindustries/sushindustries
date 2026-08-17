---
title: Guides
summary: Using Boot Loader well, and the mistakes that look like it is broken.
---

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

## Accessibility

`role="status"` and not `alert` - something loading is not an interruption.
`aria-busy` is what actually says "wait", and the digits are `aria-hidden`
because "zero four seven" is not information. The label carries the meaning.
