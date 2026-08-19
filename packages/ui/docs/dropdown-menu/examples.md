---
title: Examples
summary: Dropdown Menu in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="dropdown-menu" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## The row menu in a table

This is the job the component was written for. The menu lives in a scrolling
cell, which is exactly where a portal-free menu gets clipped - here it does
not, because the top layer is positioned against the viewport and not against
any ancestor.

```tsx
import { DataTable, DropdownMenu } from "@sushindustries/ui";

export function Documents({ rows, run }) {
	return (
		<DataTable
			label="Documents"
			rows={rows}
			columns={[
				{ id: "title", header: "Title" },
				{
					id: "id",
					header: "",
					cell: (row) => (
						<DropdownMenu
							label="Actions"
							buttonClassName="btn btn-quiet btn-icon"
							align="end"
							items={[
								{ id: "open", label: "Open on the site", icon: "link" },
								{ id: "retitle", label: "Change title…", icon: "text" },
								{
									id: "remove",
									label: "Remove…",
									icon: "close",
									destructive: true,
									disabled: row.published,
								},
							]}
							onSelect={(action) => run(action, row)}
						/>
					),
				},
			]}
		/>
	);
}
```

## What this example is not

`Remove…` is red and disabled on a published row, and neither of those is a
confirmation - selecting it calls `run` immediately. Put a `Dialog` behind that
action if it needs a second look. `align="end"` is right because this is the
last column; in the first column it would push the menu off the left edge, and
the clamp would drag it back rather than align it.
