---
title: Guides
summary: Using Bar Chart well, and the mistakes that look like it is broken.
---

## Composing it

Two accessors, a direction and a height. Anything that needs a second series, a
stack or a time axis has outgrown this and should call `defineChart` directly,
which is why `@tanstack/charts` is a dependency rather than something hidden
behind a wrapper.

```tsx
<BarChart
	label="Tokens per document kind"
	description="Source files are two thirds of the index by weight."
	rows={counts.map((one) => ({ label: one.kind, value: one.tokens }))}
	height={180}
/>
```

`description` is the finding, not the data: "source files are two thirds of the
index" rather than "a bar chart with nine bars". The numbers belong in the
table beside it.

## Colour comes from the stylesheet

`--chart-fill` is read off the rendered element at paint time, so a chart flips
with the theme like everything else and no colour is written down twice. That
is the one thing a charting library will always get wrong, because it cannot
know about `data-theme` - and a chart is where a hard-coded colour is most
obvious, since a whole bar goes the wrong way rather than a one-pixel border.

```css
.chart {
	--chart-fill: var(--accent);
	--chart-line: var(--line);
	--chart-text: var(--fg-faint);
}
```

## The three variants

`colorByCategory` cycles six of the site's own category tones, so a chart is
visibly the same palette as the nav and the badges. They are assigned by the
label's position in the data rather than by name, so re-sorting the rows keeps
`component` the colour it was.

| Prop | Value | For |
| --- | --- | --- |
| `direction` | `bar` (default) | Runs left to right, so word-shaped category labels read straight across instead of being rotated or truncated |
| `direction` | `column` | Runs bottom to top. For a few short labels, or a sequence people read as time |
| `colorByCategory` | `true` | One tone per category. For comparing kinds - never for a ranking |

## Why colour is off by default

On a single series colour carries no information: the axis already says which
bar is which, so colouring them differently is decoration that looks like
meaning. Turn it on when the categories are the subject rather than the scale.
That is "tokens per kind" and it is not "the ten most viewed pages", where the
reader is following the length and the colours only argue with it.

## When not to use it

One measure across a handful of categories is the whole remit. There is no
`format` prop - there was one for an hour, then the axes moved to the library's
own scales, which draw their own ticks, and it became a prop that took a
function and ignored it. If ticks ever need reformatting it belongs beside the
scale, not as a parallel option here.
