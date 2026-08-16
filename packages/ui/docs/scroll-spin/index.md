---
title: Scroll Spin
summary: Rotates its children with the page scroll.
---

Rotates whatever you put inside it as the page scrolls. Drag the viewport
buttons to see it at three widths — the amount of rotation per screen scrolled
is the same at every one.

<!-- ::start:showcase demo="scroll-spin" height="460" -->
<!-- ::end:showcase -->

The rotation is written straight onto the node in a `requestAnimationFrame`
callback, never through React state. At 60fps a state-driven version re-renders
the subtree on every frame of every scroll, which is the one thing guaranteed
to make a light page feel heavy.

> [!NOTE] Reduced motion
> Anyone with reduced motion set gets a still image. The effect never starts,
> rather than starting and being cancelled.
