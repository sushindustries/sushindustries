---
title: Get Started
summary: Render Dialog once, and know what you should be looking at.
---

Install commands are on Home, attached from the registry - they are not written
here, because a second copy is a copy that goes stale. This tab starts after the
install worked.

## Use it

```tsx
import { useState } from "react";
import { Button, Dialog } from "@sushindustries/ui";

export function Example() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button variant="ghost" onClick={() => setOpen(true)}>
				Delete the draft
			</Button>
			<Dialog
				open={open}
				onClose={() => setOpen(false)}
				title="Delete the draft?"
				footer={
					<>
						<Button variant="ghost" onClick={() => setOpen(false)}>
							Keep it
						</Button>
						<Button onClick={() => setOpen(false)}>Delete</Button>
					</>
				}
			>
				It has been three weeks.
			</Dialog>
		</>
	);
}
```

## What you should see

Nothing until `open` is true, then a titled box in the browser's top layer,
the page behind it dimmed and inert - you cannot tab or click into it while
the dialog is up. Escape, a click outside the box, or the close button all
call `onClose` the same way.

## If nothing happens

`Dialog` renders a real `<dialog>` element and drives it with `showModal()`
and `close()` from an effect keyed on `open`. If it never appears, the most
likely cause is `open` never actually becoming `true` in whatever state is
passed in - the component has no way to open itself, it only reflects the
prop.
