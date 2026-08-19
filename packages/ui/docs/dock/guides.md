---
title: Guides
summary: Using Dock well, and the mistakes that look like it is broken.
---

## Search opens a window, not a panel

The control is one glyph in a round well. It was a pill with the word Search in
it, which put a labelled button beside a row of buttons labelled with folder
names, all competing for the same reading. A magnifier is the one icon that
needs no label; the word lives in the tooltip and the `aria-label`.

Pressing it does not open anything here. It calls `onSearch`, and on a desktop
that means opening a window - dragged, resized, raised, closed and remembered by
exactly the same code as a folder, because it is the same thing.

That is the third version. The first was a panel above the button, which put the
results in the corner you were already looking away from and opened off the edge
on a narrow screen. The second was a palette centred on the screen, which was
better placed and still a second kind of surface on a desktop that already had
one - and which arrived with its own bugs about stacking contexts and its own
missing height bound.

A search window has none of those problems, because none of them are its
problems. It inherits the answers a window already has.

> [!CAUTION] A stacking context is not a containing block
> The dock needs to be above the desktop so a dragged window cannot cover it.
> Doing that with `position: relative; z-index` also made it the containing
> block for what it contained - which is how the centred palette ended up
> centring itself on a forty-pixel strip. A flex item takes a `z-index` while
> staying statically positioned, so `z-index` **alone** lifts the dock without
> capturing anything inside it.

## Tasks toggle

A tab bar implies one of them is showing and the others are not. Here they are
all on screen at once, stacked.

Pressing one is a toggle, which is the behaviour every taskbar has and almost
nobody writes down:

| The window is | Pressing its task |
| --- | --- |
| minimised | brings it back, and to the front |
| behind another | brings it to the front |
| already in front | minimises it |

The third case is the one people find by accident and then use constantly. It
is also why this is `toggle` in `useDeskState` rather than `raise` - the dock
does not decide, it presses.

Each task has its own close button, so a window can be dismissed without being
raised first. Minimised tasks are dimmed rather than hidden: a window that
vanishes from the dock when minimised is a window somebody has lost.

The row scrolls sideways rather than wrapping. A dock that grows a second row
moves the desktop above it, and a desktop that resizes because you opened a
window is a desktop that loses track of your icons.

## Embedded, not applied

An inset shadow at the top edge and a fill darker than the desktop, so the light
falls *into* the dock rather than off the front of it. That is the whole
difference between a strip laid on top and a channel cut in.

```css
.dock {
	background: color-mix(in srgb, var(--bg-3) 86%, transparent);
	box-shadow:
		inset 0 1px 0 color-mix(in srgb, var(--bg-3) 90%, transparent),
		inset 0 2px 6px color-mix(in srgb, var(--bg-3) 60%, transparent);
}
```

No blur: it sits on the desktop, which is a solid surface, so there is nothing
behind it worth a GPU readback. Controls inside it have no borders either - the
channel is already a boundary, and a border inside it is a second one saying the
same thing.

## Where this is used

| Where | Doing |
| --- | --- |
| The home page laptop | via `Laptop`'s `dock` slot |
| `site-shelf.tsx` | opens `SEARCH_PATH` on the desk, and decides what a chosen result does |

It is a child of the screen rather than of the scrolling desktop, so it stays
put while the desktop scrolls under it.
