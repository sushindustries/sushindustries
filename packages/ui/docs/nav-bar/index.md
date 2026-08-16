---
title: Nav Bar
summary: A site header whose panels expand, built on <details> so it works before hydration.
---

The header at the top of this page is this component. It is fed by a Markdown
file, and nothing about which site it is in is written in the component.

<!-- ::start:showcase demo="nav-bar" height="420" -->
<!-- ::end:showcase -->

## Why `<details>` and not state

A nav is the first thing a reader touches, and often they touch it before
hydration has finished. A menu driven by `useState` is inert until then: it
looks interactive, and the first tap does nothing.

`<details>` opens on click and on Enter, is announced to a screen reader as
expandable, and closes on Escape. All of that is the browser's, so it works on
the server's first paint.

What it does not have is close-on-outside-click. That comes back as one `onBlur`
handler that removes the `open` attribute when focus leaves the group. If that
handler never runs, the menu stays open until you press the trigger again, which
is mildly annoying rather than broken. That is the trade: the failure mode of
the JavaScript half is an inconvenience, not a dead control.

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

> [!CAUTION] `backdrop-filter` breaks `position: fixed` beneath it
> An element with `backdrop-filter` becomes the containing block for every
> fixed-position descendant. With the blur on the header itself, this drawer
> measured `inset: 0` against the header: a full-height drawer came out
> sixty pixels tall, in the wrong place, with a scrim that dimmed the header
> and nothing else. The fix is one line - put the blur on a pseudo-element of
> the header instead. It looks identical and the header stops being a
> containing block.

Inside the drawer, group headers and their items share one left edge and both
rows are at least 44px tall. An indent on the nested list would push every icon
tile a few pixels right of its group's icon, and the drawer would read as two
columns that nearly line up, which is worse than either lining up or clearly
not.

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

The backticked word is a glyph name. `pnpm doctor` rejects one that is not in
the glyph table, so a typo fails a check rather than silently rendering nothing.

`{categories}` expands from the registry, with a live count per category.
Writing the categories out in the nav file would be a second list to keep in
step with the first, and the first thing that goes wrong is a menu entry that
filters to nothing.

## The glass

Each item's icon sits on a translucent tile: a light top edge, a dark bottom
one, and a blurred backdrop. The two-tone border is what makes it read as a
raised piece of glass rather than a flat swatch, and it costs one gradient.

Hovering the row lifts the tile with it - the border warms to the accent and so
does the glyph - so the whole item reads as one target rather than as a link
with a picture next to it.

> [!NOTE] Motion is optional
> Panel and drawer animations, the chevron and the burger morph are all off
> under `prefers-reduced-motion: reduce`. Nothing about the menu depends on
> them; they are the polish, not the mechanism.
