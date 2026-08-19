---
title: Guides
summary: Using Nav Bar well, and the mistakes that look like it is broken.
---

## Three sizes, one markup

<!-- ::start:grid min="16rem" gap="4" -->

The wide layout is a row of triggers, each opening a panel anchored under it.
Panels are right-aligned rather than centred on their trigger, because centring
puts the last entry's panel half off-screen and then it has to be clamped, which
means its left edge moves depending on which trigger opened it.

The narrow layout is one burger opening a drawer from the right edge, full
height, over a dimmed page. A drawer rather than a dropdown: a dropdown of this
many entries covers the page it came from and leaves you unsure whether you
navigated. A drawer keeps a strip of the page visible, and that strip is what
says you are still on it.

<!-- ::end:grid -->

Both are the same markup with different CSS, at one breakpoint, mutually
exclusive on either side of it. Two components would be two things to keep in
step, and the one only visible on a phone is the one that goes stale.

| Width | What you get |
| --- | --- |
| over 860 | a row of triggers, panels two or three columns wide |
| 620 to 860 | the burger, opening a 23rem drawer over a dimmed page |
| under 620 | the burger, opening the whole screen |

A 23rem drawer on a 390px phone is not a drawer. It is a panel with a 40px
strip of unusable page beside it, and that strip is a "close" target nobody can
hit. Full width also gives the rows the space they were designed at instead of
squeezing them. The tablet keeps the drawer, because there a strip of page is
wide enough to still read as page.

The drawer takes 420ms, slower than the desktop panel's 220ms. It travels the
width of the screen, and a full-screen surface that arrives in 200ms reads as a
page change rather than as something opening.

## Four traps, all found the hard way

> [!CAUTION] `backdrop-filter` breaks `position: fixed` beneath it
> An element with `backdrop-filter` becomes the containing block for every
> fixed-position descendant. With the blur on the header itself, this drawer
> measured `inset: 0` against the header: a full-height drawer came out
> sixty pixels tall, in the wrong place, with a scrim that dimmed the header
> and nothing else. The fix is one line - put the blur on a pseudo-element of
> the header instead. It looks identical and the header stops being a
> containing block.

> [!CAUTION] One blur per surface
> The icon tiles had `backdrop-filter` too. Eighteen of them, inside a panel
> that was blurred, inside a header that was blurred, is three GPU readbacks
> per frame per layer, and it crashed the renderer. The tiles now get their
> glass from a gradient, which is what was doing the visual work anyway. The
> drawer is opaque, because it sits over a 62% scrim and was paying for a
> full-screen readback to composite something already hidden.

> [!CAUTION] A smooth-scroll driver owns the page, including over your overlay
> Lenis intercepts wheel and touch for the whole document and animates the
> scroll itself, so a drag inside this drawer moved the article behind it
> rather than the menu. The drawer carries `data-lenis-prevent`, which Lenis
> reads as "leave this subtree to the browser". Anyone not using Lenis gets an
> inert data attribute. Alongside it, `overscroll-behavior: contain` stops the
> scroll chaining at the end of the list, `touch-action: pan-y` claims vertical
> drags. What it does not do is lock the page: see below for why that cure was
> worse than the disease.

> [!CAUTION] `opacity: 0` takes the pseudo-elements with it
> The burger is three bars: the element's own background, plus `::before` and
> `::after`. Hiding the middle one with `opacity: 0` grouped all three, and
> `opacity: 1` on a pseudo-element cannot escape its parent's opacity - so
> pressing the burger hid the whole icon and the full-screen drawer opened
> with no visible way out. `background: transparent` clears only the middle
> bar, because only the parent's own background draws it.

## Closing it

While the drawer is open, the toggle becomes `position: fixed` above the sheet
and the bars cross into an X.

That is deliberate rather than a second close button. The drawer covers the
header the toggle lives in, so the toggle has to be lifted out or there is no
exit at all - and lifting the same control is better than adding another,
because the thing that closes the menu is visibly the thing that opened it, in
the same place, having changed shape.

Escape also closes it, for free, because it is a `<details>`.

Nothing on the page moves as it opens, and getting there meant taking something
out rather than adding it.

The obvious way to stop the page moving behind a drawer is
`html:has(.nav-burger[open]) { overflow: hidden }`. It is worse than the
problem it solves, twice over. Making the scrolling element non-scrollable
drops its scroll offset, so opening the menu halfway down a page throws the
reader back to the top and closing it does not bring them back. It also removes
the scrollbar, which makes the document about fifteen pixels wider at that
instant, so everything centred slides sideways as the menu arrives.

So there is no scroll lock. What actually needed fixing was scroll chaining,
and that is handled where it happens: `overscroll-behavior` and `touch-action`
on the sheet, and `data-lenis-prevent` so the smooth-scroll driver leaves the
drawer alone. The page behind can still be scrolled while it is covered, which
is a smaller cost than losing someone's place.

`scrollbar-gutter: stable` stays on `html` regardless, because the width of the
gutter should not depend on whether a given page happens to be long enough to
need it.

Inside the drawer, every row starts with a tile on one column, group headers
included. Items sit behind a rule set in by the tile's width rather than
indented: indenting would push each item's tile a few pixels right of its
group's, and the drawer would read as two columns that nearly line up, which is
worse than either lining up or clearly not. Rows are at least 44px tall, and
they answer a press with `:active`, since a touch screen has no hover to give.

<!-- ::start:spacer size="6" label="Where it is used" -->
<!-- ::end:spacer -->

## Where this is used

| Where | What it renders |
| --- | --- |
| Every page on this site | via `apps/web/src/modules/chrome/site-nav.tsx` |
| `apps/web/content/nav.md` | the entries, as a nested Markdown list |
| `packages/ui/glyphs.md` | the icon on each entry and item |
| `packages/ui/registry.ts` | the Components panel, expanded from the categories |

`site-nav.tsx` is nine lines and holds one decision: that this particular site
has a wordmark and a GitHub link. Everything else moved out to somewhere it can
be edited without touching a component.

## The Markdown format

```text
- [Components](/components) `layers`
  - {categories}
- [Writing](/posts) `note`
```

A top-level item is an entry. Indent under one and it becomes a panel;
leave it alone and it stays a plain link, which is right for most of them - a
menu that opens to reveal one link is more interface than the thing it hides.

The backticked word is a glyph name. `pnpm run doctor` rejects one that is not in
the glyph table, so a typo fails a check rather than silently rendering nothing.

`{categories}` expands from the registry, with a live count per category.
Writing the categories out in the nav file would be a second list to keep in
step with the first, and the first thing that goes wrong is a menu entry that
filters to nothing.

## The glass

Each icon sits on a tile with a light top edge fading into a darker fill. That
gradient is the whole effect: a lit edge over a solid body is what reads as a
raised piece of glass, and it costs one `linear-gradient`.

It used to have a `backdrop-filter` as well, which is what crashed the
renderer. Removing it changed almost nothing about how the tile looks, which is
the useful part of the story - the filter was never doing the work.

Hovering the row lifts the tile with it - the border warms to the accent and so
does the glyph - so the whole item reads as one target rather than as a link
with a picture next to it.

> [!NOTE] Motion is optional
> Panel and drawer animations, the chevron and the burger morph are all off
> under `prefers-reduced-motion: reduce`. Nothing about the menu depends on
> them; they are the polish, not the mechanism.
