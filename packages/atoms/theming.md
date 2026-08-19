---
title: Theming
summary: How colour is decided here - one palette, aliases on top, variants as attributes, and why there is no dark mode yet.
---

# Theming

Four layers, and a value may only ever refer downward:

```text
1  palette    --sheet-*, --ink*, --salmon, --wasabi …   literal colours
2  roles      --bg-*, --fg-*, --accent, --line …        what a thing is for
3  tones      --tone-motion, --pastel-clay …            what a thing belongs to
4  blocks     .card, .nav-panel-icon …                  never a literal
```

`pnpm doctor` enforces the last line: a hex value anywhere outside the `tokens`
layer is a build failure. That check is the only reason repainting the whole
site was a hundred-line diff rather than a week.

## The layers earn their keep at the moment you repaint

The site was a dark green-grey for a long time and read like an aquarium. Going
to warm pastel changed **layer 1 only** - and then exposed exactly the places
where layers had been skipped.

Three tokens were doing several jobs at once, and only a dark theme could hide
it:

| Was | Doing | Now |
| --- | --- | --- |
| `--nori-900` | the page ground, *and* the machine's case, *and* the colour shadows are made of | `--bg-0`, `--shell`, `--shadow` |
| `--rice` | body text, *and* the lit edge on glass | `--ink`, `--shell-edge` |
| `--nori-600` | a deep surface, *and* the keyboard deck | `--bg-3`, `--shell-deep` |

Every one of those was a coincidence rather than a relationship. A shadow is
not a surface - it is the absence of light on whatever is underneath - so it
stays near-black however pale the page gets. It is the one value that does
**not** invert with the theme, and the only way to find that out is to try.

> [!NOTE] The rule the split gives you
> If two things share a token, ask whether they would still share it in a theme
> you have not built. If not, they were never the same value.

## Depth replaces brightness

On a dark ground surfaces separate by getting **lighter**. That direction does
not exist on a pale one - everything is already light - so depth moved to where
it lives in the world: shadow.

```css
--lift-1  /* resting on the page: a card */
--lift-2  /* picked up: a hover, a menu */
--lift-3  /* over everything: a window, the machine */
```

Each is *two* shadows - a tight contact edge and a wide soft cast. One blur on
its own reads as a glow underneath the object rather than as the object being
above the page.

The practical consequence is that the four surface steps are now nearly
identical in value. They can be, because a shadow separates them. **If two
surfaces need a large step to be told apart, they wanted a shadow.**

## Where pastel stops

Two sets, and the split is the whole discipline:

| Set | Example | Rule |
| --- | --- | --- |
| Hues | `--accent`, `--folder`, `--info` | carry words. Every one clears 4.5:1 on `--sheet-0` |
| Fills | `--pastel-clay`, `--tone-docs` | never carry words. As pale as they like |

The first pastel pass failed this and had to be measured to find out:

```text
accent as text   2.72:1   unreadable
folder glyph     2.49:1   unreadable
text on accent   3.14:1   below AA
```

A pale ground and a pale accent is a lovely swatch and an unreadable label. On
a dark ground these carried contrast by being *brighter* than everything
around them; on a pale one there is nothing left to be brighter than, so the
only direction is down.

The fills are mixed **from the page itself**:

```css
--pastel-sage: color-mix(in srgb, var(--wasabi) 18%, var(--sheet-0));
```

All at one lightness and one saturation, so they sit *in* the palette. A set
built by picking six colours individually never does - one of them is always
brighter than the rest and the eye finds it first.

## Tones: a colour per kind of thing

`--tone-<category>` and `--tone-<category>-ink`, aliasing hues that already
exist. They are aliases and not new colours on purpose: a category system made
of fresh values is a second palette that drifts from the first.

Adding a sixth category means choosing among the hues that exist. **If none of
them fits, the category is probably not a new kind of thing.**

The DOM carries the name and the stylesheet decides what it looks like:

```tsx
<span className="nav-panel-icon" data-tone={item.tone} />
```

```css
.nav-panel-icon[data-tone="motion"] {
	background: var(--tone-motion);
	color: var(--tone-motion-ink);
}
```

`NavItem.tone` is typed as a plain `string`, not a union. A component library
has no business knowing this site has five categories or what they are called.

> [!CAUTION] Colour has to be information, not trim
> Archive cards briefly wore their category as a 3px left border. Twenty-five
> cards with a coloured edge read as a broken grid rather than as a grouping -
> the eye follows the ragged edge instead of the content. The tint moved onto
> the preview panel, which already falls back to printing the category's *name*
> and is therefore the part of the card that is genuinely about it.

## Variants are attributes

Every one, everywhere:

```css
.device[data-device="tablet"]        /* not .device--tablet   */
.pv-viewer[data-controls="false"]    /* not .pv-viewer--flat  */
.shelf-tile[data-art="true"]         /* not .shelf-tile--art  */
```

An attribute travels with the component, cannot be applied without its base,
and is visible in the props rather than in a stylesheet somebody has to find. A
modifier class is all three of those the wrong way round, and `pnpm doctor`
fails on a `--` in any class name in `packages/ui`.

## The layer order is the design

```css
@layer tokens, base, blocks, utilities;
```

Utilities last, so **a utility always beats a block** regardless of
specificity. That is what makes "compose in the markup" true rather than
aspirational: `<div className="card p-3">` gets 12px of padding without anyone
writing `.card.p-3` or an `!important`.

It also frees a block to be written the way it reads best - descendant
selectors, states, attributes - without that specificity leaking out and
beating the scale. **Anything that needs to beat a utility is a bug in the
utility.**

Generated stylesheets are imported *into* a layer, never above it:

```css
@import "./devices.css" layer(blocks);
```

An unlayered `@import` lands in the unlayered origin, which beats every layer -
so a media query about the shape of a machine would start winning arguments
with `p-3`.

## Two schemes on one screen

`color-scheme: light` on `:root` is what tells the browser to draw its **own**
furniture to match: form controls, the default scrollbar, the paint before the
stylesheet lands, the canvas behind an overscroll bounce. Without it a light
page keeps a dark native scrollbar, which is the detail that makes a theme look
half-applied rather than wrong.

Packages that theme themselves have to be pinned:

```tsx
<html lang="en" data-pv-theme="light">
```

`@sushindustries/react-product-viewer` reads `prefers-color-scheme`, which is
the right default for a package that does not know what it has been dropped
into. This site *does* know. Without the pin, a machine set to dark drew a dark
canvas and a dark loading scrim inside a pale page - two themes on one screen,
decided by an operating-system setting neither of them asked about.

Pinning at the consumer rather than editing the package keeps the package
correct for everybody else.

## There is no dark mode, deliberately

The structure supports one: a second theme costs a redefinition of layer 1 and
nothing else, which is the entire reason the aliases exist.

It is not built because a switcher is not a colour problem, it is an SSR
problem. The server has to emit the right theme in the *first byte* or the page
flashes, and the reader's choice lives in a cookie or in `localStorage` - one
of which the server can see and one of which it cannot.

TanStack Start's guidance on this is the same as its guidance on clocks and
time zones: a value the server cannot know must not decide the first render.
The three ways out are a cookie read in a middleware, a blocking inline script
before paint, or `<ClientOnly>` with a stable fallback. Each is a real design
with real costs, and none of them is "add a media query".

Until one of those is chosen, `color-scheme: light` and a pinned viewer theme
are honest: the site is light, it says so, and nothing on the page disagrees.
