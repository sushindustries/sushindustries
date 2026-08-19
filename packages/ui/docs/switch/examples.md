---
title: Examples
summary: Switch in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="switch" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { useState } from "react";
import { Switch } from "@sushindustries/ui";

export function ScrollPreferences() {
	const [smooth, setSmooth] = useState(true);
	const [reducedMotion, setReducedMotion] = useState(false);

	return (
		<fieldset className="flex flex-col gap-3">
			<legend className="label">Motion</legend>
			<Switch
				label="Smooth scrolling"
				checked={smooth}
				onChange={(event) => setSmooth(event.target.checked)}
			/>
			<Switch
				label="Reduce motion"
				checked={reducedMotion}
				onChange={(event) => setReducedMotion(event.target.checked)}
			/>
		</fieldset>
	);
}
```

## What this example is not

Each switch here changes its own setting immediately - neither is wired to
a submit button. That immediacy is what `role="switch"` promises; a form
that needs a confirm step before anything takes effect should use
`Checkbox` instead, not a `Switch` gated behind a button.
