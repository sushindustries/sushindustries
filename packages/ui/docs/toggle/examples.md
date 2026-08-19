---
title: Examples
summary: Toggle in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="toggle" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { useState } from "react";
import { ToggleGroup } from "@sushindustries/ui";

export function ShowcaseTabs() {
	const [view, setView] = useState("preview");

	return (
		<>
			<ToggleGroup
				label="View"
				value={view}
				onChange={setView}
				options={[
					{ value: "preview", label: "Preview" },
					{ value: "code", label: "Code" },
				]}
			/>
			{view === "preview" ? <p>Rendered output goes here.</p> : <pre>Source goes here.</pre>}
		</>
	);
}
```

## What this example is not

Switching `view` here swaps two static blocks with a plain conditional -
`ToggleGroup` reports the chosen value and stops there. Whatever the
selection controls, including animating between the two states, is code
the page around it owns.
