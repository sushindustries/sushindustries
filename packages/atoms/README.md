# @sushindustries/atoms

Design tokens and the atomic utilities built on them. One stylesheet, no build
step, no framework, no class-name generator.

## Install

```bash
pnpm add @sushindustries/atoms
```

## Use

Import it once, at the root of the app:

```ts
import "@sushindustries/atoms/atoms.css";
```

Then compose. Every class does exactly one thing:

```tsx
<article className="card">
	<h3 className="h3 m-0">Title</h3>
	<p className="m-0 fg-dim text-sm">Body copy.</p>
</article>
```

## Elements & utilities

The package is one stylesheet in four layers - `tokens`, `base`, `blocks`,
`utilities` - and the utilities are the part meant to be composed in markup.
The vocabulary deliberately covers the same axes Bootstrap's utility API
covers, with two differences: every spacing value is a token from the `--s-*`
scale rather than a free number, and there is exactly one name per job.

| Axis | Classes | Bootstrap's spelling of the same idea |
| --- | --- | --- |
| Display | `.flex` `.inline-flex` `.grid` `.block` `.hidden` | `d-flex` `d-inline-flex` `d-grid` `d-block` `d-none` |
| Flex direction & wrap | `.col` `.wrap` | `flex-column` `flex-wrap` |
| Align & justify | `.items-center/-start/-end/-baseline` `.justify-center/-between/-start/-end` | `align-items-*` `justify-content-*` |
| Self alignment | `.self-start` `.self-center` `.self-end` | `align-self-*` |
| Grow & shrink | `.flex-1` `.shrink-0` `.min-w-0` | `flex-fill` `flex-shrink-0` |
| Gap | `.gap-1` … `.gap-7` | `gap-{0-5}` |
| Margin | `.m-0` `.mt-1`…`.mt-7` `.mb-1`…`.mb-7` `.mx-auto` `.ms-auto` `.me-auto` `.mt-auto` | `m-0` `mt-*` `mb-*` `mx-auto` `ms-auto` `me-auto` `mt-auto` |
| Padding | `.p-0`…`.p-6` `.px-2`…`.px-5` `.py-2`…`.py-7` | `p-*` `px-*` `py-*` |
| Sizing | `.w-full` `.h-full` `.max-w-full` `.max-w-prose` `.max-w-sm` | `w-100` `h-100` `mw-100` |
| Position | `.relative` `.absolute` `.sticky` `.fixed` `.inset-0` `.z-1` `.z-nav` | `position-*` `top-0`/`bottom-0`… |
| Type size | `.text-xs` `.text-sm` `.text-md` `.text-lg` `.h1` `.h2` `.h3` | `fs-*` `h1`…`h3` |
| Type style | `.font-medium` `.font-semibold` `.italic` `.mono` `.uppercase` `.label` | `fw-*` `fst-italic` `text-uppercase` |
| Text layout | `.text-center` `.text-end` `.text-balance` `.text-pretty` `.nowrap` `.truncate` `.leading-tight` | `text-center` `text-end` `text-nowrap` `text-truncate` `lh-*` |
| Colour | `.fg` `.fg-dim` `.fg-faint` `.fg-accent` `.bg-1` `.bg-2` | `text-*` `bg-*` |
| Border | `.border` `.border-t` `.border-b` `.border-s` `.border-e` | `border` `border-top`… `border-start`… |
| Radius | `.rounded` `.rounded-lg` `.rounded-xl` `.rounded-full` | `rounded-*` `rounded-circle`/`pill` |
| Overflow | `.overflow-hidden` `.overflow-auto` `.overflow-x-auto` | `overflow-*` |
| Accessibility | `.sr-only` `.pointer` | `visually-hidden` |

What Bootstrap has that this deliberately does not: opacity and shadow
utilities (elevation is a material decision, and material lives in the
`blocks` layer, not in markup), percentage widths (`w-25/50/75` - that is a
grid's job), and the responsive infix system (`d-md-none` - variants here are
data-attributes on blocks, and containers respond with container queries).

Open the stylesheet: https://github.com/sushindustries/sushindustries/blob/main/packages/atoms/src/atoms.css

## Why not Tailwind

Tailwind is the right answer when a team needs every utility and a build step
is already paid for. This is one stylesheet of about 300 lines, served as-is
and cached forever. Nothing scans your source, nothing purges, and reading the
file tells you the whole system.

The trade is real: there is no arbitrary value syntax. If a value is not in the
scale, you either add it to the scale or you use the scale. That is the point -
a short scale is what makes an interface look measured rather than assembled.

## Tokens

Colour is nori (green-black) ground, rice (warm off-white) text, one salmon
accent. Spacing is a 9-step scale, type is a clamped scale so one set of
headings covers phone through desktop.

Override any of them by redefining the custom property on `:root` after the
import.

Example override:

```css
:root {
  --color-text: #111111;
  --color-bg: #ffffff;
  --s-3: 1.5rem;
}
```

## Units, and which one when

Fluid responsiveness is mostly a question of picking the right unit, and the
right unit is the one that measures the thing the value actually depends on.

| Use | Unit | Why |
| --- | --- | --- |
| Font size | `rem` | Scales with the reader's browser setting. `px` here overrides a preference someone set on purpose |
| Fluid font size | `clamp(rem, rem + vw, rem)` | See below |
| Line length | `ch` | The measure is a count of characters, so measure it in characters. `62ch` holds whatever the font is |
| Space inside a component | `--s-1` to `--s-9`, fixed | A 12px gap between two fixed-size things is 12px everywhere |
| Space between sections | `--space-block`, `--space-section`, `--space-page`, fluid | A proportion of the page, not a fixed distance |
| Space that tracks its own text | `em` | Button padding should grow with the button's font size |
| Full width | `100%` | Never `100vw`: it includes the scrollbar, so it overflows on any page that scrolls |
| Full height | `dvh` | See below |
| Component-relative width | `cqi`, `@container` | The component's own width, not the window's |
| Hairlines, radii, shadows | `px` | These should not scale. A 1px border is a 1px border at every size |

### The `clamp` middle term needs a `rem` in it

```css
--t-h2: clamp(1.5rem, 1.1rem + 1.9vw, 2.5rem);
```

Floor, preferred, ceiling. The preferred term is `1.1rem + 1.9vw`, not `1.9vw`
alone, and that is the whole trick.

A preferred term of pure `vw` ignores the reader's font-size setting completely:
it is a function of the window and nothing else, so someone who has set their
browser to 24px gets the same headings as someone who has not. Adding a `rem`
component keeps the value responsive to both the viewport and the person.

### `dvh`, not `vh`

On a mobile browser, `vh` is the viewport height with the toolbars retracted.
A `100vh` element is therefore taller than the screen while the address bar is
showing, and its last hundred pixels are unreachable.

- `dvh` - the current height, changing as the bar hides. What you usually want.
- `svh` - the smallest it gets. Use when the element must never be clipped.
- `lvh` - the largest. Rarely the right answer.

`100dvh` on a full-screen drawer is the difference between a menu whose last
entry can be tapped and one whose last entry cannot.

## Browser support & notes

- `clamp()` - supported in modern browsers; see https://developer.mozilla.org/docs/Web/CSS/clamp
- Container queries (`@container`) - modern support; see https://developer.mozilla.org/docs/Web/CSS/@container
- Viewport units: `dvh` - supported in modern mobile browsers; see https://developer.mozilla.org/docs/Web/CSS/dvh
- `aspect-ratio` - use instead of the padding-top percentage hack; see https://developer.mozilla.org/docs/Web/CSS/aspect-ratio

### Container queries beat media queries in a library

A media query asks how wide the window is. A component three levels inside a
sidebar does not care how wide the window is, and cannot be correct in both the
sidebar and the main column from one answer about the window.

```css
.cq { container-type: inline-size; }

@container (min-width: 30rem) {
	.thing { grid-template-columns: 1fr 1fr; }
}
```

The `.cq` utility opts a subtree in. `Grid` avoids needing it at all by using
`repeat(auto-fit, minmax(min, 1fr))`, which is a container query with no syntax:
columns fit as many as will fit in the space given, so the same grid is correct
in both places without asking anything.

Reach for a media query when the thing being changed really is about the
window - a sticky header's height, or whether a nav is a row or a drawer.

### Two more that remove a whole class of bug

`min()` for the container, so one declaration says "as wide as allowed, less a
gutter, never wider than the measure":

```css
width: min(100% - var(--gutter) * 2, var(--container));
```

And `aspect-ratio` instead of the padding-top percentage hack, which was never
about padding and always read as though it was.
