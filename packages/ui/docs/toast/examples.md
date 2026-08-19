---
title: Examples
summary: Toast in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="toast" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { Button, useToast } from "@sushindustries/ui";

export function SaveSettingsButton({ onSave }: { onSave: () => Promise<void> }) {
	const { toast } = useToast();

	return (
		<Button
			onClick={async () => {
				await onSave();
				toast("Settings saved");
			}}
		>
			Save
		</Button>
	);
}
```

## What this example is not

`ToastProvider` is not shown here - this component assumes it is already
mounted somewhere above it in the tree, the way it would be once, near the
app's root, not per button.
