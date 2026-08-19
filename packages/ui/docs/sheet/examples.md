---
title: Examples
summary: Sheet in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="sheet" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Sheet } from "@sushindustries/ui";
import { useState } from "react";

export function ProductCard() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<div className="card p-4">
				<h3 className="h4 m-0">Reveal</h3>
				<button type="button" onClick={() => setOpen(true)}>
					Quick view
				</button>
			</div>
			<Sheet
				open={open}
				onClose={() => setOpen(false)}
				title="Reveal"
				side="right"
			>
				<p>Fades and rises its children the first time they reach the viewport.</p>
			</Sheet>
		</>
	);
}
```
