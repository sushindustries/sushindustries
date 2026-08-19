---
title: Guides
summary: Using Data Table well, and the mistakes that look like it is broken.
---

## Composing it

A column is an id into the row plus how that column is meant to be read.
`numeric` right-aligns it, `mono` makes it breakable for a path or a hash, and
`cell` takes over the rendering when the raw value is not what a reader wants.

```tsx
const columns = [
	{ id: "path", header: "Path", mono: true },
	{ id: "kind", header: "Kind", sortable: true },
	{
		id: "tokens",
		header: "Tokens",
		numeric: true,
		sortable: true,
		cell: (row) => row.tokens.toLocaleString(),
	},
];
```

The frame is `overflow-x-auto max-w-full border rounded-xl bg-1` in the markup,
not a block class. That is what guarantees a table's border and radius match
the cards beside it rather than drifting from them.

## Density and banding

Both are attributes on the table, so a caller cannot half-apply one by passing
a stray class name.

| Prop | Value | For |
| --- | --- | --- |
| `density` | `comfortable` (default) | A table somebody reads a few rows of |
| `density` | `compact` | Half the padding, same type size. For scanning fifty rows, where the padding is most of the height |
| `striped` | `true` | Bands alternate rows, so the eye cannot slip between the first column and the last. Earns its place on a wide table |

Type size is the same in both densities. Shrinking the text to fit more of it
is where a dense table stops being readable and becomes a screenshot of a
table. And banding on a three-column table has no distance to slip across, so
there it is decoration that makes every second row look selected.

## Sorting is somebody else's tested code

TanStack Table v9 does the row models and the comparators; this adds the markup
and the class names, which is the half a headless library deliberately has no
opinion about. v9 is not v8 - it takes an explicit `features` object and
`create*RowModel`, so v8's shape type-errors here rather than rendering an
empty table.

## When not to use it

`Table` is the same look with no dependency, and it is the right answer for a
table that is read once and sorted never. Filtering, pagination and grouping
are not here either: each is one more feature slot when something needs it, and
until then they are code nobody ships.
