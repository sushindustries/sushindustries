---
title: Examples
summary: Bar Chart in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="bar-chart" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## The shape above the numbers

A chart and the table it summarises, which is the pairing that makes the chart
worth drawing: the shape answers "which kind is the index mostly made of", and
anyone who needs the figure reads it off the table underneath.

```tsx
import { BarChart, DataTable } from "@sushindustries/ui";

export function IndexWeight({ counts }) {
	return (
		<section className="flex col gap-4">
			<BarChart
				label="Tokens per document kind"
				description="Source files are two thirds of the index by weight."
				rows={counts.map((one) => ({ label: one.kind, value: one.tokens }))}
				colorByCategory
				height={180}
			/>
			<DataTable
				label="Tokens per document kind"
				rows={counts}
				sortBy="tokens"
				descending
				density="compact"
				columns={[
					{ id: "kind", header: "Kind", sortable: true },
					{
						id: "tokens",
						header: "Tokens",
						numeric: true,
						sortable: true,
						cell: (row) => row.tokens.toLocaleString(),
					},
				]}
			/>
		</section>
	);
}
```

## A short sequence, read as time

Four quarters is the case for `column`: the labels are short enough to sit
under a bar, and people read a sequence left to right.

```tsx
<BarChart
	label="Posts published per quarter"
	direction="column"
	rows={quarters}
	height={160}
/>
```

## What this example is not

`colorByCategory` is right in the first example because the kinds are the
subject, and it would be wrong on the second - four quarters are a sequence,
and colouring them would imply a difference the reader would go looking for.
Neither chart formats its own ticks. And `rows` is already summed here; nothing
in this component groups or aggregates anything.
