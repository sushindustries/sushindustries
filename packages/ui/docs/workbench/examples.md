---
title: Examples
summary: Workbench in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="workbench" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## A browser over an index

All four slots earning their place: the toolbar holds the one action, the rail
holds the filters that must not scroll away, the status line holds the counts
somebody checks without reading anything else.

```tsx
import { Button, DataTable, Workbench } from "@sushindustries/ui";

export function DocumentBrowser({ kind, kinds, rows, onKind }) {
	return (
		<Workbench
			title="documents"
			label="Every document in the index"
			maxHeight="32rem"
			toolbar={<Button>New</Button>}
			rail={
				<div className="flex col gap-2">
					<span className="label">Kind</span>
					{kinds.map((one) => (
						<button key={one} type="button" onClick={() => onKind(one)}>
							{one}
						</button>
					))}
				</div>
			}
			status={
				<span className="workbench-stat">
					<b>{rows.length}</b> of <b>1,240</b> in <b>{kind}</b>
				</span>
			}
		>
			<DataTable label="Documents" rows={rows} columns={columns} density="compact" />
		</Workbench>
	);
}
```

## Inside a card

A workbench nested in something that already has a border wants `panel`, so
there is one material rather than two.

```tsx
<Card title="Index">
	<Workbench variant="panel" title="recent" maxHeight="18rem">
		<Rows />
	</Workbench>
</Card>
```

## What this example is not

`maxHeight` is what makes the body its own scroller - drop it and the browser
grows to the height of 1,240 rows and the page scrolls instead. `columns` and
the filter state are the caller's; this component holds neither, so nothing
here is filtering anything on its own.
