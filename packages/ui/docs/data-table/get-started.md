---
title: Get Started
summary: Render Data Table once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { DataTable } from "@sushindustries/ui";
import "@sushindustries/atoms/atoms.css";

const rows = [
	{ kind: "source", files: 96, tokens: 412_310 },
	{ kind: "component", files: 245, tokens: 188_004 },
];

export function Example() {
	return (
		<DataTable
			label="Documents by kind, with their token cost"
			rows={rows}
			sortBy="tokens"
			descending
			columns={[
				{ id: "kind", header: "Kind", sortable: true },
				{ id: "tokens", header: "Tokens", numeric: true, sortable: true },
			]}
		/>
	);
}
```

## What you should see

A bordered table with a sticky header row, `Tokens` right-aligned in tabular
figures, and a down arrow beside it because `sortBy` and `descending` set the
first sort. The two sortable headers are buttons: clicking one toggles it, and
the arrow slot holds its width so the header row never shifts sideways.
`label` is the caption, read out and never drawn.

## If nothing happens

Headers that are plain text with no border and no banding mean
`@sushindustries/atoms/atoms.css` was never imported - the frame and every cell
rule live there. A header that will not sort has no `sortable: true` on its
column; that is off by default, because a column of long prose sorts into
nonsense. An empty table is not an error, it says `empty` - usually a filter.
