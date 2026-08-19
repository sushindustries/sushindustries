---
title: Examples
summary: Data Table in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="data-table" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## Fifty rows somebody is scanning

Six columns of build output: paths in mono, sizes in figures, a menu in the
last column. This is the shape both variants were written for - `compact`
because fifty rows of comfortable padding need two screens, `striped` because
at six columns wide the eye slips a row between the first and the last.

```tsx
import { DataTable, DropdownMenu } from "@sushindustries/ui";

export function Artefacts({ artefacts, onAction }) {
	return (
		<DataTable
			label="Build artefacts, largest first"
			rows={artefacts}
			sortBy="bytes"
			descending
			density="compact"
			striped
			empty="No artefacts from this build."
			columns={[
				{ id: "path", header: "Path", mono: true },
				{ id: "kind", header: "Kind", sortable: true },
				{
					id: "bytes",
					header: "Size",
					numeric: true,
					sortable: true,
					cell: (row) => `${(row.bytes / 1024).toFixed(1)} kB`,
				},
				{
					id: "id",
					header: "",
					cell: (row) => (
						<DropdownMenu
							label="Actions"
							align="end"
							items={[{ id: "open", label: "Open", icon: "link" }]}
							onSelect={(action) => onAction(action, row)}
						/>
					),
				},
			]}
		/>
	);
}
```

## What this example is not

Nothing here filters. `empty` is what shows when `rows` arrives empty, and
`rows` is the caller's - a filtered list is a filtered array passed in, not a
prop on this component. The row menu is a `DropdownMenu` in a `cell`, and it
aligns to `end` because it is the last column; that is a choice about this
table, not something the column knows to do.
