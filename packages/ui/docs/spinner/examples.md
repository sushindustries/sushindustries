---
title: Examples
summary: Spinner in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="spinner" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { useState } from "react";
import { Spinner } from "@sushindustries/ui";

export function SaveButton({ onSave }: { onSave: () => Promise<void> }) {
	const [saving, setSaving] = useState(false);

	return (
		<button
			type="button"
			className="btn"
			disabled={saving}
			onClick={async () => {
				setSaving(true);
				await onSave();
				setSaving(false);
			}}
		>
			{saving ? <Spinner size={14} label="Saving" /> : "Save"}
		</button>
	);
}
```

## What this example is not

Swapping the button's own text for the spinner, rather than showing both,
is a choice this example makes - `Spinner` has no opinion on whether it
replaces or sits beside a label; that layout is the caller's.
