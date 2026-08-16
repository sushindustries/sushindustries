---
title: Dock
summary: A launcher, what is open, and a corner. Search opens in the middle of the screen.
---

<!-- ::start:showcase demo="dock" height="360" -->
<!-- ::end:showcase -->

## Three parts

| Part | Is |
| --- | --- |
| The launcher | a pill with a magnifier, opening a search palette |
| The tasks | one button per open window; pressing one raises it |
| The corner | whatever the consumer puts there. On this site: a reset, a LinkedIn link and a clock |

## The launcher is a pill, and it opens in the middle

A square button that opens a search box is a button. A pill with a magnifier in
it is a search box nobody has typed in yet - the shape is the promise, and it
costs a `border-radius`.

The palette centres on the screen rather than anchoring to the button. Anchored,
it put the results in the corner you were already looking away from, and on a
narrow screen it opened off the edge and had to be clamped. Centred, it lands
where the eye goes when you decide to search, and it is the same place at every
size.

Slightly above centre, at 42%. Optically centred things sit a little high, and a
panel that grows downward as results arrive would walk off the bottom from a
true middle.

> [!CAUTION] A stacking context is not a containing block
> The dock needs to be above the desktop so a dragged window cannot cover it.
> Doing that with `position: relative; z-index: 5` also made it the containing
> block for the palette inside it - which then centred itself on a forty-pixel
> strip and came out squashed against the bottom edge. A flex item takes a
> `z-index` while staying statically positioned, so `z-index` **alone** lifts
> the dock without capturing what it contains.

## Tasks are buttons, not tabs

A tab bar implies one of them is showing and the others are not. Here they are
all on screen at once, stacked, and pressing one raises it. Calling that a tab
would be a lie about what the press does.

The row scrolls sideways rather than wrapping. A dock that grows a second row
moves the desktop above it, and a desktop that resizes because you opened a
window is a desktop that loses track of your icons.

## Embedded, not applied

An inset shadow at the top edge and a fill darker than the desktop, so the light
falls *into* the dock rather than off the front of it. That is the whole
difference between a strip laid on top and a channel cut in.

No blur: it sits on the desktop, which is a solid surface, so there is nothing
behind it worth a GPU readback. Controls inside it have no borders either - the
channel is already a boundary, and a border inside it is a second one saying the
same thing.

## Results are the consumer's

`results` arrives already filtered. The dock renders a list and calls
`onSelect`; it does not know what is being searched, which is what lets the same
component list files on one site and orders on another.

## Where this is used

| Where | Doing |
| --- | --- |
| The home page laptop | via `Laptop`'s `dock` slot |
| `site-shelf.tsx` | walks the shelf tree for results, opens folders in a window and routes to pages |

It is a child of the screen rather than of the scrolling desktop, so the
palette is measured against the screen and clipped by the screen. Inside the
desktop it would be measured against a scrolled box and cut off by it.
