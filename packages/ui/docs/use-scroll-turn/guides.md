---
title: Guides
summary: Why the measurement is a hook, what a revolution is measured in, and what happens under reduced motion.
---

## Why it is a hook and not just part of `ScrollSpin`

`ScrollSpin` writes a CSS transform. The hero on the home page writes a
three.js object's rotation, because a CSS `rotateY` on a canvas spins the
rendered image like a photograph rather than turning the model inside it.

Two completely different write targets, one question: how far has this page
turned. Sharing the measurement means a screenful of scrolling turns the CSS
mark and the GLB by the same amount, which is the sort of agreement that
silently stops being true the moment it is written twice.

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
