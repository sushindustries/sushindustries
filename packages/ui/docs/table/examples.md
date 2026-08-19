---
title: Examples
summary: Table in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="table" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Table } from "@sushindustries/ui";

interface Package {
	name: string;
	version: string;
	downloads: number;
}

export function PackageList({ packages }: { packages: Package[] }) {
	return (
		<section className="card p-4">
			<h2>Packages</h2>
			<Table
				caption="Every package in this workspace, with its published version"
				rowKey={(row) => row.name}
				columns={[
					{ key: "name", header: "Package", render: (row) => row.name },
					{ key: "version", header: "Version", render: (row) => row.version },
					{
						key: "downloads",
						header: "Downloads",
						align: "right",
						render: (row) => row.downloads.toLocaleString(),
					},
				]}
				rows={packages}
			/>
		</section>
	);
}
```

## What this example is not

`toLocaleString()` here is the caller formatting a number for display -
`Table` renders whatever `render` returns and has no formatting of its own,
for numbers, dates or anything else.
