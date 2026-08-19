---
title: Get Started
summary: Render Table once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { Table } from "@sushindustries/ui";

interface Category {
	name: string;
	count: number;
}

const rows: Category[] = [
	{ name: "Components", count: 61 },
	{ name: "Blocks", count: 12 },
];

export function Example() {
	return (
		<Table
			rowKey={(row) => row.name}
			columns={[
				{ key: "name", header: "Category", render: (row) => row.name },
				{ key: "count", header: "Items", align: "right", render: (row) => row.count },
			]}
			rows={rows}
		/>
	);
}
```

## What you should see

A real `<table>`: an uppercase, monospace header row, one row per item in
`rows`, and the "Items" column's numbers right-aligned with tabular
figures while "Category" stays left-aligned. The whole thing sits in a
bordered frame that scrolls sideways on its own if the columns are wider
than the viewport - the page itself never grows wider.

## If nothing happens

An empty `rows` array leaves the header row standing with no body under it
- that is correct, not broken. If two rows look identical or React warns
about duplicate keys, `rowKey` is not returning a unique string per row;
check for duplicate ids in the source data before assuming the component is
at fault.
