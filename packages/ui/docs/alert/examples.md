---
title: Examples
summary: Alert in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="alert" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { useState } from "react";
import { Alert, Button } from "@sushindustries/ui";

export function SaveForm() {
	const [error, setError] = useState<string | null>(null);

	async function onSubmit() {
		try {
			await save();
		} catch {
			setError("Could not save. Try again.");
		}
	}

	return (
		<form className="flex col gap-3">
			{error ? (
				<Alert title="Save failed" tone="caution" live>
					{error}
				</Alert>
			) : null}
			<Button type="submit" onClick={onSubmit}>
				Save
			</Button>
		</form>
	);
}
```

## What this example is not

The alert here is conditionally rendered on failure, with `live` set
because it reports something that just happened. It is not a toast: it
stays in the form's own layout rather than floating above the page, and
it does not dismiss itself - clearing `error` on the next successful save
is the form's job, not the component's.
