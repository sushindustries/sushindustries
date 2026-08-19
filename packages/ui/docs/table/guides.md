---
title: Guides
summary: Using Table well, and the mistakes that look like it is broken.
---

## Composing it

The table's own frame carries `data-lenis-prevent`, so a drag that starts
inside a wide table scrolls the table sideways rather than being picked up
by `SmoothScroll` on the page behind it. Nothing about placement matters
beyond that - it works the same inside a card, a section, or bare on a
page.

## Variants

`align` is the one per-column variant, and it is set per `TableColumn`
rather than on the table as a whole - each column decides its own
alignment:

```tsx
{ key: "count", header: "Items", align: "right", render: (row) => row.count }
```

```css
.table td[data-align="right"] {
	text-align: right;
	font-variant-numeric: tabular-nums;
}
```

Leave `align` off and a column reads left, which is correct for names,
labels and anything that is not a number.

## When not to use it

Not a data grid - there is no sorting, selection, resizing or
virtualization built in, on purpose; `rows` renders in the order given and
every row renders every time. For a few dozen rows that is nothing; for
hundreds or thousands, pair this with `@tanstack/react-virtual` rather than
handing all of them to `Table` at once, since nothing here windows the DOM
for you.
