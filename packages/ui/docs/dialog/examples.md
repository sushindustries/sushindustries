---
title: Examples
summary: Dialog in something real, at every width it has to survive.
---

Examples are the tab where the component is shown doing a job, not
demonstrating a prop. The API tab already lists the props.

<!-- ::start:showcase demo="dialog" height="420" -->
<!-- ::end:showcase -->

Press Compare. The frames are real viewports, so a layout that breaks at 320
breaks here too rather than in somebody's hands.

## In a page

```tsx
import { useState } from "react";
import { Button, Dialog } from "@sushindustries/ui";

export function DeletePostButton({ onDelete }: { onDelete: () => void }) {
	const [confirming, setConfirming] = useState(false);

	return (
		<>
			<Button variant="ghost" onClick={() => setConfirming(true)}>
				Delete
			</Button>
			<Dialog
				open={confirming}
				onClose={() => setConfirming(false)}
				title="Delete this post?"
				footer={
					<>
						<Button variant="ghost" onClick={() => setConfirming(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => {
								setConfirming(false);
								onDelete();
							}}
						>
							Delete
						</Button>
					</>
				}
			>
				This cannot be undone.
			</Dialog>
		</>
	);
}
```

## What this example is not

Not a form dialog. `children` here is a sentence, not inputs - a dialog that
collects data needs its own focus-management thinking about which field
gets focus on open, which this example never has to consider.
