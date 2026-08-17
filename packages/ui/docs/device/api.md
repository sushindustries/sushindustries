---
title: Device API
summary: Every prop, what it defaults to, and what happens when it is wrong.
---

<!-- generated:api -->

## Props

| Prop | Type | Default | Does |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | The desktop. It scrolls on its own and chains at the end. |
| `kind?` | `DeviceKind` | - | Which machine to draw. Left off, the stylesheet decides from the width of the window: a phone, a tablet from 720px, a laptop from 1080px. Set it and that choice wins everywhere, which is what a Settings panel writes and what a showcase uses to put all three on one page. |
| `wallpaper?` | `ReactNode` | - | Drawn behind the desktop, and never in the way of a click. |
| `title?` | `string` | - | Shown in the strip at the top of the screen. |
| `toolbar?` | `ReactNode` | - | Also in the strip, right-aligned. A search field, a clock, a count. |
| `dock?` | `ReactNode` | - | Pinned along the bottom of the screen, below the scrolling desktop. |

<!-- /generated:api -->

## Notes

Anything the types cannot say: which combinations are meaningless, which
prop is ignored when another is set, and what it does when handed
something it cannot render.
